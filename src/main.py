import sys
import requests
from bs4 import BeautifulSoup

url=sys.argv[1]
response = requests.get(url)

soup = BeautifulSoup(response.text, 'html.parser')
element = soup.find('body').find(sys.argv[2])
print(element)
