from flask import Flask, jsonify, render_template
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

app = Flask(__name__)

# Cache variables to avoid hammering the Google feed
cached_notes = None

def fetch_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=10)
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
                    # Clean the html code (make sure links open in a new tab)
                    update_soup = BeautifulSoup(update_html, 'html.parser')
                    for a in update_soup.find_all('a'):
                        a['target'] = '_blank'
                        a['rel'] = 'noopener noreferrer'
                    update_html = str(update_soup)
                    update_text = update_soup.get_text(separator=' ').strip()
                    
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
            update_soup = BeautifulSoup(update_html, 'html.parser')
            for a in update_soup.find_all('a'):
                a['target'] = '_blank'
                a['rel'] = 'noopener noreferrer'
            update_html = str(update_soup)
            update_text = update_soup.get_text(separator=' ').strip()
            
            updates.append({
                'type': current_type,
                'html': update_html,
                'text': update_text
            })
            
        if not updates and content_html.strip():
            update_soup = BeautifulSoup(content_html, 'html.parser')
            for a in update_soup.find_all('a'):
                a['target'] = '_blank'
                a['rel'] = 'noopener noreferrer'
            updates.append({
                'type': 'General',
                'html': str(update_soup),
                'text': update_soup.get_text(separator=' ').strip()
            })
            
        # Add index-based ID for direct referencing
        for idx, upd in enumerate(updates):
            # Generate a cleaner selector ID
            clean_date = title.replace(" ", "_").replace(",", "")
            upd['id'] = f"{clean_date}-update-{idx}"
            
        entries.append({
            'date': title,
            'updated': updated,
            'id': entry_id,
            'link': link,
            'updates': updates
        })
        
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    global cached_notes
    try:
        cached_notes = fetch_release_notes()
        return jsonify({'success': True, 'notes': cached_notes})
    except Exception as e:
        if cached_notes:
            return jsonify({
                'success': True, 
                'notes': cached_notes, 
                'warning': f"Could not fetch latest feed: {str(e)}. Showing cached version."
            })
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
