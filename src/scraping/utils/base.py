from abc import ABC, abstractmethod
from typing import final
import os
import json
import csv

class BaseScraper(ABC):
    def __init__(self, save_path, topic):
        self.save_path = save_path
        self.topic = topic

    @abstractmethod
    def scrap_articles(self):
        """
        Scrap article links from search.
        """

    @abstractmethod
    def scrap_article_content(self):
        """
        Scrap individual content from articles.
        """

    @abstractmethod
    def run_article_scraping(self):
        """
        Run the article scraping process.
        """

    @abstractmethod
    def run_content_scraping(self):
        """
        Run the content scraping process.
        """

    @abstractmethod
    def index(self):
        """
        Index articles in the database.
        """

    @abstractmethod
    def run(self):
        """
        Run the scraping and indexing process (run_article_scraping, run_content_scraping, index).
        """

    @final
    def save_json(self, articles, filename):
        """
        Save articles to a JSON file.
        """
        file_path = os.path.join(self.save_path, f"{filename}_{self.topic}.json")
        with open(file_path, "w", encoding="utf-8") as fp:
            json.dump(articles, fp, ensure_ascii=False, indent=4)

    @final
    def save_csv(self, articles, filename):
        """
        Save articles to a CSV file.
        """
        file_path = os.path.join(self.save_path, f"{filename}_{self.topic}.csv")
        with open(file_path, "w", newline="", encoding="utf-8") as fp:
            writer = csv.DictWriter(fp, fieldnames=articles[0].keys())
            writer.writeheader()
            writer.writerows(articles)

    def convert_timestamp(self):
        """
        Convert string timestamp to isoformat.
        """

    def authenticate(self):
        """
        Authenticate user with cookies.
        """

    def paginate(self):
        """
        Paginate through the website articles.
        """
