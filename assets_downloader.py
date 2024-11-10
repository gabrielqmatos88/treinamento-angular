import os
import requests
import json

colors = {
    'normal': '\033[0m',  # Reset color
    'red': '\033[91m',
    'blue': '\033[94m',
    'green': '\033[92m',
    'cyan': '\033[96m',
    'yellow': '\033[93m'
}

def log(message, color='default'):
    if color == 'normal':
        print(colors['normal'] + message + colors['normal'])
    elif color == 'red':
        print(colors['red'] + message + colors['normal'])
    elif color == 'blue':
        print(colors['blue'] + message + colors['normal'])
    elif color == 'green':
        print(colors['green'] + message + colors['normal'])
    elif color == 'cyan':
        print(colors['cyan'] + message + colors['normal'])
    elif color == 'yellow':
        print(colors['yellow'] + message + colors['normal'])

def download_image (url , assets_path):
    if url in ['null', None, ''] or url.startswith('data:'):
        return
    if not os.path.exists(assets_path):
        os.makedirs(assets_path)
        print("Created directory", assets_path, "for storing images")

    filename  = os.path.basename(url)
    filepath = os.path.join ( assets_path , filename)
    if os.path.exists(filepath):
        log(f'Image {filename} already exists in the path, skipping download', 'cyan')
        return
    log(f'Downloading Image from {url}', 'cyan')
    content = requests.get(url).content
    with open(f'{assets_path}/{filename}', 'wb') as f:
        print('Saving to ', filepath, '...')
        f.write(content)
        log(f'{colors["yellow"]}{assets_path}/{filename}{colors["green"]} - ok', 'green')


def load_json():
    data = None
    with open('./assets/json/data.json', encoding='utf-8') as f:
        data = json.load(f)
    return data
    
data =  load_json()
for p in data['products']:
    download_image(p['img_url'], 'assets/produtos')
for store in data['stores']:
    download_image(store['logo'], 'assets/logos')