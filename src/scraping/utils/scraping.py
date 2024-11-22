import os
import logging
import json
import csv
import time
import locale
from datetime import datetime
from bs4 import BeautifulSoup
import tqdm
from typing import List, Dict

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from utils.base import BaseScraper
from utils.article import Article
from utils.db import Database

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class LeCourrierScraper(BaseScraper):
    def __init__(
        self,
        topic: str,
        save_path: str,
        save: List[str],
        headless: bool = False
    ):
        self.topic = topic
        self.base_url = "https://lecourrier.ch"
        self.url = f"{self.base_url}/?s={self.topic}"
        options = Options()
        if headless:
            options.add_argument("--headless")
        self.driver = webdriver.Firefox(options=options)
        self.save_path = save_path
        self.save = save

    def scrap_articles(self, soup) -> List[Dict]:
        article_tags = soup.find_all("article", class_="c-Card c-Card--search")
        articles = []
        for article in article_tags:
            try:
                articles.append({
                    "source": self.base_url,
                    "title": article.span.text.strip(),
                    "abstract": article.find(
                        "div", class_="c-Card-content"
                    ).text.strip(),
                    "topic": article.find(
                        "span", class_="c-Card-tag"
                    ).text.strip(),
                    "link": article.a["href"],
                    "author": article.find(
                        "span", class_="c-Card-author"
                    ).text.strip(),
                    "published_date": self.convert_timestamp(
                        article.find("span", class_="c-Card-date").text.strip()
                    ),
                })
            except Exception as e:
                logger.error(f"Error scraping article: {e}")
        return articles

    def paginate(self):
        try:
            time.sleep(2)
            next_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, "a.next.page-numbers")
                )
            )
            next_button.click()
            WebDriverWait(self.driver, 10).until(EC.staleness_of(next_button))
        except Exception as e:
            logger.info(f"No more pages or error occurred during pagination: {e}")
            self.driver.quit()
            raise StopIteration

    def convert_timestamp(self, date_string: str) -> str:
        # Set the locale to French
        locale.setlocale(locale.LC_TIME, "fr_FR.UTF-8")
        # Convert the string to a datetime object
        date_object = datetime.strptime(date_string, "%A %d %B %Y")
        return date_object.isoformat()

    def run_article_scraping(self):
        scraped_articles = []
        self.driver.get(self.url)

        while True:
            try:
                time.sleep(3)
                soup = BeautifulSoup(
                    self.driver.page_source, features="html.parser"
                )
                articles = self.scrap_articles(soup)
                scraped_articles.extend(articles)
                logger.info(f"Scraped {len(articles)} articles from current page.")

                self.paginate()
            except StopIteration:
                break
            except Exception as e:
                logger.error(f"Error during scraping: {e}")
                break

        # Save after scraping all pages
        if "json" in self.save:
            self.save_json(scraped_articles, filename="articles")

        if "csv" in self.save:
            self.save_csv(scraped_articles, filename="articles")

    def authenticate(self):
        self.driver.get(self.base_url)
        cookies_path = os.path.join(
            "../../../data/cookies", "lecourrier_cookies.json"
        )
        with open(cookies_path, "r") as file:
            cookies = json.load(file)
        for cookie in cookies:
            self.driver.add_cookie(cookie)

    def scrap_article_content(self, soup):
        article = soup.find("article")
        return article.get_text(strip=True) if article else ""

    def run_content_scraping(self):
        self.authenticate()

        # Load articles metadata
        file_path = os.path.join(self.save_path, f"articles_{self.topic}.json")
        with open(file_path, "r", encoding="utf-8") as file:
            article_list = json.load(file)

        augmented_articles = []

        for article in tqdm.tqdm(article_list):
            time.sleep(2)
            try:
                self.driver.get(article["link"])
                soup = BeautifulSoup(
                    self.driver.page_source, features="html.parser"
                )
                article_text = self.scrap_article_content(soup)
                article["text"] = article_text
                article["html"] = str(soup)
                augmented_articles.append(article)
            except Exception as e:
                logger.info(
                    f"Error {e} scraping article: {article['link']}"
                )

        # Save augmented articles
        if "json" in self.save:
            self.save_json(augmented_articles, filename="aug_content")

        if "csv" in self.save:
            self.save_csv(augmented_articles, filename="aug_content")

        # Upsert to database
        self.index(augmented_articles)
        self.driver.quit()

    def index(self, articles):
        db = Database()
        for article in articles:
            Article(
                source=article["source"],
                link=article["link"],
                author=article["author"],
                title=article["title"],
                html=article["html"],
                text=article["text"],
                published_date=article["published_date"],
                topic=article["topic"],
                abstract=article["abstract"],
            ).upsert(db.db)
        db.close()

    def run(self):
        self.run_article_scraping()
        self.run_content_scraping()
        self.driver.quit()

    """
    def save_json(self, articles, filename):
        file_path = os.path.join(self.save_path, f"{filename}_{self.topic}.json")
        with open(file_path, "w", encoding="utf-8") as fp:
            json.dump(articles, fp, ensure_ascii=False, indent=4)

    def save_csv(self, articles, filename):
        file_path = os.path.join(self.save_path, f"{filename}_{self.topic}.csv")
        with open(file_path, "w", newline="", encoding="utf-8") as fp:
            writer = csv.DictWriter(fp, fieldnames=articles[0].keys())
            writer.writeheader()
            writer.writerows(articles)
    """
