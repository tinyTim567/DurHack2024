#!/usr/bin/env python3
import json
import flag
import requests

def get_continents(wikidata_id):
    url = f"https://www.wikidata.org/wiki/Special:EntityData/{wikidata_id}.json"
    response = requests.get(url)
    data = response.json()

    continents = []
    if 'entities' in data and wikidata_id in data['entities']:
        entity = data['entities'][wikidata_id]
        if 'claims' in entity:
            claims = entity['claims']
            # Property ID for continent is P30
            if 'P30' in claims:
                for claim in claims['P30']:
                    continent_id = claim['mainsnak']['datavalue']['value']['id']
                    continent_name = get_entity_label(continent_id)
                    continents.append(continent_name)
    return continents

def get_entity_label(entity_id):
    url = f"https://www.wikidata.org/wiki/Special:EntityData/{entity_id}.json"
    response = requests.get(url)
    data = response.json()
    return data['entities'][entity_id]['labels']['en']['value'] if 'entities' in data and entity_id in data['entities'] else None

f = open('/home/eddie/Downloads/export.json')
j = json.loads(f.read())
c = {}
for ele in j["elements"]:
    e = {}
    e["name"] = ele["tags"]["name:en"]
    print(f"Processing {e["name"]}...")
    if "flag" in ele["tags"]:
        e["flag"] = ele["tags"]["flag"]
    f = flag.flag(ele["tags"]["ISO3166-1"])
    if f != ele["tags"]["ISO3166-1"]:
        e["emoji"] = f
    if "timezone" in ele["tags"]:
        e["timezone"] = ele["tags"]["timezone"]
    e["continents"] = get_continents(ele["tags"]["wikidata"])
    e["osm_relation"] = ele["id"]
    c[ele["tags"]["ISO3166-1"]] = e

f = open('countries.json', 'w')
f.write(json.dumps(c))
f.close()

print('Done')
