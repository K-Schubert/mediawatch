import os
import logging
from typing import Optional
import csv

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Article():

    def __init__(self, source: str, link: str, author: str, title: str, html: str, text: str, published_date: str, topic: Optional[str] = None, abstract: Optional[str] = None):
        self.source = source
        self.link = link
        self.author = author
        self.title = title
        self.html = html
        self.text = text
        self.published_date = published_date
        self.topic = topic if topic else None
        self.abstract = abstract if abstract else None

    def __repr__(self):
        return f"Article(source={self.source}, link={self.link}, author={self.author}, title={self.title}, html={self.html}, text={self.text}, published_date={self.published_date}, topic={self.topic}, abstract={self.abstract})"

    def append_to_csv(self, file_path):
        # Check if the file already exists and if it is empty
        file_exists = os.path.isfile(file_path)
        write_header = not file_exists or os.stat(file_path).st_size == 0

        with open(file_path, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)

            # Write the header only if the file is new or empty
            if write_header:
                writer.writerow(['source', 'link', 'author', 'title', 'html', 'text', 'published_date', 'topic', 'abstract'])

            # Write the article data
            writer.writerow([self.source, self.link, self.author, self.title, self.html, self.text, self.published_date, self.topic, self.abstract])

    def upsert(self, db):

        query = """
        INSERT INTO articles (source, link, author, title, html, text, published_date, topic, abstract)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (link)
        DO UPDATE SET
            source = EXCLUDED.source,
            link = EXCLUDED.link,
            author = EXCLUDED.author,
            title = EXCLUDED.title,
            html = EXCLUDED.html,
            text = EXCLUDED.text,
            published_date = EXCLUDED.published_date,
            topic = EXCLUDED.topic,
            abstract = EXCLUDED.abstract
        RETURNING id;
        """

        values = (self.source, self.link, self.author, self.title, self.html, self.text, self.published_date, self.topic, self.abstract)

        try:
            # Execute the query with the provided db connection/cursor
            cursor = db.cursor()
            cursor.execute(query, values)

            # Commit the transaction
            db.commit()

            logger.info("Upserted article: %s", values)
        except Exception as e:
            db.rollback()
            logger.info("Error during upsert: %s", e)
        finally:
            cursor.close()
