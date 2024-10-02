import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

POSTGRES_USER = os.environ.get("POSTGRES_USER", None)
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", None)
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", None)
POSTGRES_DB = os.environ.get("POSTGRES_DB", None)

class Database():

    def __init__(self):
        self.db = self.get_db()

    def get_db(self):
        db = psycopg2.connect(
            dbname=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host="localhost",
            port=POSTGRES_PORT
        )

        return db

    def clear_table(self, table_name):
        cursor = self.db.cursor()
        try:
            cursor.execute(f"DELETE FROM {table_name}")
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e
        finally:
            cursor.close()

    def table_to_csv(self, table_name, save_path):
        with open(os.path.join(save_path, f'{table_name}.csv'), 'w', newline='', encoding='utf-8') as file:
            cursor = self.db.cursor()
            try:
                cursor.copy_expert(f"COPY {table_name} TO STDOUT WITH CSV HEADER", file)
            finally:
                cursor.close()  # Close the cursor

    def close(self):
        if self.db:
            self.db.close()
