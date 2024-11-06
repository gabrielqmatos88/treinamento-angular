from scrapy import Request
from scrapy.crawler import CrawlerProcess
from scrapy import Item, Field
from scrapy.spiders import CrawlSpider, Rule, Spider
from scrapy.linkextractors import LinkExtractor
import re
from pathlib import Path
import json
import os
import requests
import shutil
import base64
import random

def create_directory(dir):
    print('creating directory: ', dir)
    if not os.path.exists(dir):
        os.makedirs(dir)
        print('created directory')

def delete_directory(dir):
    print('deleting directory: ', dir)
    if os.path.exists(dir):
        shutil.rmtree(dir)
        print('deleted directory')


class LojaItem(Item):
    id = Field()
    name = Field()
    opened = Field()
    delivery_time = Field()
    category = Field()
    url = Field()
    logo = Field()
    region_id = Field()

class ProductItem(Item):
    id = Field()
    name = Field()
    desc = Field()
    price = Field()
    image_url = Field()
    url = Field()
    store = Field()

class ByfoodScraper(Spider):
    name = "byfood"
    allowed_domains = ['byfood.com.br']
    start_urls = ["https://www.byfood.com.br/lista/caxias-do-sul-rs", "https://www.byfood.com.br/lista/belo-horizonte-mg"]
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
        "REQUEST_FINGERPRINTER_IMPLEMENTATION": "2.7",
        'LOG_CONFIG': { 'LOG_CONFIG': None }
    }
    lojas = []
    produtos = []

    def get_id_loja(self, url):
        return url.split("/")[-1].split('.')[0]
    
    def generate_random_str(self, length = 5):
        return ''.join([random.choice('abcdefghijklmnopqrstuvwxyz') for i in range(length)])
    
    def download_img(self, url, path):
        if url is None or len(url) == 0:
            return
        if url.startswith('data:'):
            return
        filename = url.split('/')[-1]
        img_data = requests.get(url).content
        
        try:
            create_directory(path)
            with open(path + filename , 'wb') as f:
                f.write(img_data)
        except Exception as e:
            print("Error downloading image: ", url, e)


    def parse(self, response):
        region_id = response.url.split('/')[-1]
        for empresa in response.css(".col-item-empresa"):
            data = {}
            href = re.sub(r'/?\?.*','', empresa.css("a::attr(href)").get())
            data['id'] = self.get_id_loja(href)
            data['name'] = empresa.css("h5::text")[0].extract().strip()
            data['opened'] = empresa.css(".empresa-status b::text").get() == 'Aberto'
            data['url'] = href
            data['logo'] = empresa.css("img::attr(src)").get()
            data['region_id'] = region_id
            self.lojas.append(data)
            self.download_img(data["logo"], "assets/logos/")
            yield Request(href, callback=self.parse_product)

    def parse_product(self, response):
        store_id = self.get_id_loja(response.url)
        for prod in response.css("a.item-produto"):
            href= prod.css("a::attr(href)").get()
            id = href.split("/")[-1]
            item = {}
            item['id'] = id
            item['name'] = prod.css("h3::text").get().strip()
            item['desc'] = prod.css(".produto-descricao::text").get()
            item['price'] = prod.css(".label::text").get().replace('R$ ', '').replace(',', '.')
            item['url'] = prod.css("a::attr(href)").get()
            item['image_url'] = prod.css(".image-outer img::attr(src)").get()
            item['store'] = store_id
            self.produtos.append(item)
            self.download_img(item["image_url"], "assets/produtos/")
            yield item

    def close(self, reason):
        self.logger.info('Total de lojas: %d', len(self.lojas))
        self.logger.info('Total de produtos: %d', len(self.produtos))
        with open("results.json", "w") as f:
            content = json.dumps({ 'lojas': self.lojas, 'produtos': self.produtos }, indent=4)
            f.write(content)



if __name__ == "__main__":
    # removing previuous results
    delete_directory('assets')
    # recreaing directories
    create_directory('assets')
    # starting crawler process
    crawler = CrawlerProcess()
    crawler.crawl(ByfoodScraper)
    crawler.start()
# Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0