import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATABASE_PATH = BASE_DIR / "products.db"


def get_connection():
    connection = sqlite3.connect(
        DATABASE_PATH,
        timeout=10
    )

    connection.row_factory = sqlite3.Row

    # Better SQLite concurrency
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA busy_timeout=10000")
    connection.execute("PRAGMA foreign_keys=ON")

    return connection


def create_table():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT NOT NULL,
                category TEXT NOT NULL,
                stock_date TEXT,
                expiry_date TEXT,
                current_stock INTEGER,
                historical_sales INTEGER,
                selling_price REAL,
                demand_rate REAL,
                sales_velocity INTEGER,
                days_left INTEGER,
                expected_demand INTEGER,
                prediction TEXT,
                dataset_product_id INTEGER,
                discount REAL,
                final_price REAL,
                wastage_quantity INTEGER,
                expiry_risk REAL,
                waste_risk TEXT,
                recommended_discount REAL,
                image_data TEXT
            )
        """)

        cursor.execute("PRAGMA table_info(products)")
        cols = {row["name"] for row in cursor.fetchall()}

        if "image_data" not in cols:
            cursor.execute(
                "ALTER TABLE products ADD COLUMN image_data TEXT"
            )

        connection.commit()

    finally:
        connection.close()


def _username_has_unique_constraint(cursor):
    """
    Reliably detect whether the existing users table has a UNIQUE
    constraint/index on username.

    This works for both:
        username TEXT UNIQUE
    and:
        UNIQUE(username)
    and SQLite auto-generated UNIQUE indexes.
    """

    cursor.execute("PRAGMA index_list(users)")
    indexes = cursor.fetchall()

    for index in indexes:

        index_name = index["name"]
        is_unique = int(index["unique"])

        if not is_unique:
            continue

        # SQLite PRAGMA statements do not support parameter placeholders.
        # The index name comes directly from SQLite's own index_list output,
        # so quote it safely as an identifier before executing the PRAGMA.
        safe_index_name = str(index_name).replace('"', '""')

        cursor.execute(
            f'PRAGMA index_info("{safe_index_name}")'
        )

        index_columns = cursor.fetchall()

        if len(index_columns) == 1:
            column_name = index_columns[0]["name"]

            if column_name == "username":
                return True

    return False


def _migrate_users_table(cursor):
    """
    Rebuild the users table so that:

        username -> NOT UNIQUE
        email    -> UNIQUE
        password -> duplicates allowed
        id       -> unique primary key

    Existing user IDs, usernames, emails, password hashes,
    active states and roles are preserved.
    """

    print(
        "Migrating users table: allowing duplicate usernames..."
    )

    cursor.execute("""
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE,
            hashed_password TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            role TEXT DEFAULT 'customer'
        )
    """)

    cursor.execute("""
        INSERT INTO users_new (
            id,
            username,
            email,
            hashed_password,
            is_active,
            role
        )
        SELECT
            id,
            username,
            email,
            hashed_password,
            is_active,
            COALESCE(role, 'customer')
        FROM users
    """)

    cursor.execute("DROP TABLE users")

    cursor.execute("""
        ALTER TABLE users_new
        RENAME TO users
    """)

    print(
        "Users table migration completed successfully."
    )


def create_users_table():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        # --------------------------------------------------------
        # Create the new schema for a fresh database.
        # --------------------------------------------------------

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE,
                hashed_password TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                role TEXT DEFAULT 'customer'
            )
        """)

        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()

        cols = {
            row["name"]
            for row in columns
        }

        if "role" not in cols:
            cursor.execute("""
                ALTER TABLE users
                ADD COLUMN role TEXT DEFAULT 'customer'
            """)

        # --------------------------------------------------------
        # Existing database migration.
        #
        # Old schema:
        #   username TEXT UNIQUE NOT NULL
        #
        # New schema:
        #   username TEXT NOT NULL
        #   email TEXT UNIQUE
        # --------------------------------------------------------

        if _username_has_unique_constraint(cursor):
            _migrate_users_table(cursor)

        # Existing admin account remains admin.
        cursor.execute("""
            UPDATE users
            SET role = 'admin'
            WHERE LOWER(username) = 'admin'
        """)

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def create_purchases_table():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                user_id INTEGER,
                quantity INTEGER NOT NULL,
                price_per_unit REAL NOT NULL,
                total_amount REAL NOT NULL,
                purchased_at TEXT NOT NULL,
                days_left_at_purchase INTEGER,
                waste_risk_at_purchase TEXT,
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
        """)

        cursor.execute("PRAGMA table_info(purchases)")
        cols = {row["name"] for row in cursor.fetchall()}

        if "days_left_at_purchase" not in cols:
            cursor.execute("""
                ALTER TABLE purchases
                ADD COLUMN days_left_at_purchase INTEGER
            """)

        if "waste_risk_at_purchase" not in cols:
            cursor.execute("""
                ALTER TABLE purchases
                ADD COLUMN waste_risk_at_purchase TEXT
            """)

        if "user_id" not in cols:
            cursor.execute("""
                ALTER TABLE purchases
                ADD COLUMN user_id INTEGER
            """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_purchases_user_id
            ON purchases(user_id)
        """)

        connection.commit()

    finally:
        connection.close()
