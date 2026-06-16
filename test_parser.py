import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import json

def fetch_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch release notes: HTTP {response.status_code}")
        
    xml_data = response.content
    root = ET.fromstring(xml_data)
    
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = []
    
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns).text  # e.g., "June 15, 2026"
        entry_id = entry.find('atom:id', ns).text
        updated = entry.find('atom:updated', ns).text
        link_elem = entry.find("atom:link[@rel='alternate']", ns)
        link = link_elem.attrib.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        soup = BeautifulSoup(content_html, 'html.parser')
        
        current_type = "Update"
        current_elements = []
        updates = []
        
        for child in soup.children:
            if child.name == 'h3':
                if current_elements:
                    update_html = "".join(str(el) for el in current_elements)
                    update_text = BeautifulSoup(update_html, 'html.parser').get_text(separator=' ').strip()
                    updates.append({
                        'type': current_type,
                        'html': update_html,
                        'text': update_text
                    })
                    current_elements = []
                current_type = child.get_text().strip()
            elif child.name is not None:
                current_elements.append(child)
                
        if current_elements:
            update_html = "".join(str(el) for el in current_elements)
            update_text = BeautifulSoup(update_html, 'html.parser').get_text(separator=' ').strip()
            updates.append({
                'type': current_type,
                'html': update_html,
                'text': update_text
            })
            
        if not updates and content_html.strip():
            updates.append({
                'type': 'General',
                'html': content_html,
                'text': soup.get_text(separator=' ').strip()
            })
            
        entries.append({
            'date': title,
            'updated': updated,
            'id': entry_id,
            'link': link,
            'updates': updates
        })
        
    return entries

if __name__ == '__main__':
    try:
        notes = fetch_release_notes()
        print(f"Successfully fetched {len(notes)} release entries.")
        if notes:
            print("\nFirst entry detail:")
            print(json.dumps(notes[0], indent=2))
    except Exception as e:
        print(f"Error: {e}")
