const nanToInf = (x) => {
  if (isNaN(x)) return Infinity;
  return x;
};

function overpass_get_subregions(path) {
  query = "";
  last_admin_level = "";
  path.forEach((p) => {
    query += `relation`;
    if (last_admin_level) {
      query += `(r.admin_level_${last_admin_level})`;
    }
    query += `["${p[1][0]}"="${p[1][1]}"]["type"="boundary"]["admin_level"="${p[2]}"]->.admin_level_${p[2]};\n`;
    last_admin_level = `${p[2]}`;
  });
  query += `rel(r.admin_level_${last_admin_level}:"subarea");
out ids tags;`;
  return overpass_query(query).then((j) => {
    return j.elements.map((e) => {
      let key = "name";
      // try to find an appropriate identifier for this subregion
      if (e.tags["ISO3166-2"]) {
        key = "ISO3166-2";
      } else if (e.tags["ref"]) {
        key = "ref";
      } else if (e.tags["official_name"]) {
        key = "official_name";
      }
      return [
        e.tags["name:en"] || e.tags["name"],
        [key, e.tags[key]],
        nanToInf(parseInt(e.tags.admin_level)),
      ];
    });
  });
}

function overpass_get_bb(path) {
  query = "";
  last_admin_level = "";
  path.forEach((p) => {
    query += `relation`;
    if (last_admin_level) {
      query += `(r.admin_level_${last_admin_level})`;
    }
    query += `["${p[1][0]}"="${p[1][1]}"]["type"="boundary"]["admin_level"="${p[2]}"]->.admin_level_${p[2]};\n`;
    last_admin_level = `${p[2]}`;
  });
  query += `.admin_level_${last_admin_level} out ids bb;`;
  return overpass_query(query).then((j) => {
    return j.elements[0].bounds;
  });
}

function overpass_get_subregions_with_geom(path) {
  query = "";
  last_admin_level = "";
  path.forEach((p) => {
    query += `relation`;
    if (last_admin_level) {
      query += `(r.admin_level_${last_admin_level})`;
    }
    query += `["${p[1][0]}"="${p[1][1]}"]["type"="boundary"]["admin_level"="${p[2]}"]->.admin_level_${p[2]};\n`;
    last_admin_level = `${p[2]}`;
  });
  query += `rel(r.admin_level_${last_admin_level}:"subarea");
  out geom;`;
  return overpass_query(query).then((j) => {
    return j.elements.map((e) => {
      let key = "name";
      // try to find an appropriate identifier for this subregion
      if (e.tags["ISO3166-2"]) {
        key = "ISO3166-2";
      } else if (e.tags["ref"]) {
        key = "ref";
      } else if (e.tags["official_name"]) {
        key = "official_name";
      }
      return [
        e.tags["name:en"] || e.tags["name"],
        [key, e.tags[key]],
        nanToInf(parseInt(e.tags.admin_level)),
      ];
    });
  });
}

function overpass_query(query) {
  return fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    // The body contains the query
    // to understand the query language see "The Programmatic Query Language" on
    // https://wiki.openstreetmap.org/wiki/Overpass_API#The_Programmatic_Query_Language_(OverpassQL)
    body: "data=" + encodeURIComponent("[out:json];\n" + query),
  }).then((res) => {
    if (res.ok) {
      return res.json();
    } else {
      throw new Error(`Overpass API error, response status: ${res.status}`);
    }
  });
}
