const continents = [
  ["Africa", "", 1],
  ["Asia", "", 1],
  ["Europe", "", 1],
  ["North America", "", 1],
  ["Oceania", "", 1],
  ["South America", "", 1],
];

const navScreen = document.getElementById("nav-screen");
const mapScreen = document.getElementById("map-screen");
const navRow = document.getElementById("nav-row");

let cache = {};

let current_path = [];
let active_nav_items = [];

let names,
  score = 0,
  maxscore,
  tries,
  nameLayerDict = {};

const cmpRegions = (r1, r2) => {
  let k1 = r1[0];
  let k2 = r2[0];
  if (k1 < k2) return -1;
  if (k1 > k2) return 1;
  return 0;
};

const getRegions = (path) => {
  return new Promise((res, rej) => {
    let json_path = JSON.stringify(path);
    if (json_path in cache) {
      res(cache[json_path]);
      return;
    }
    let admin_level = path[path.length - 1][2];

    if (admin_level == 1) {
      fetch("continents.json")
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error(`Response status: ${res.status}`);
          }
        })
        .then((data) => {
          let out = data[path[0][0]]
            .map((element) => [
              (element.emoji ? element.emoji + " " : "") + element.name,
              ["ISO3166-1", element.iso_code],
              2,
            ])
            .sort(cmpRegions);
          cache[json_path] = out;
          res(out);
        })
        .catch(rej);
    } else {
      overpass_get_subregions(path.slice(1))
        .then((data) => {
          let out = data.sort(cmpRegions);
          cache[json_path] = out;
          res(out);
        })
        .catch(rej);
    }
  });
};

const getPlayData = (path) => {
  return overpass_get_subregions_with_geom(path.slice(1)).then((borders) => {
    borders["features"] = borders["features"].filter((f) =>
      f["id"].startsWith("relation/"),
    );
    return borders;
  });
};

function shuffleArray(array) {
  for (var i = array.length - 1; i >= 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

const gameOver = () => {
  document.getElementById("map-side-panel").innerText =
    `Game over! Your score is ${score}/${maxscore} (${Math.round((100 * score) / maxscore)}%).`;
};

const nextName = () => {
  console.log(names);
  document.getElementById("targetPlaceName").innerText = names[0];
  tries = 3;
};

const hint = () => {
  // Very clear hint: give them the answer and physically stop them from clicking on anything else
  let switchColour = () => {
    if (tries == 0) {
        nameLayerDict[names[0]]._path.setAttribute("data-flashing", "true");
      nameLayerDict[names[0]].setStyle({ color: "initial" });
      setTimeout(() => {
        if (tries == 0) {
            nameLayerDict[names[0]]._path.setAttribute("data-flashing", "false");
          nameLayerDict[names[0]].setStyle({ color: "#3388ff" });
          setTimeout(switchColour, 250);
        }
      }, 500);
    }
  };
  switchColour();
};

const playRegion = (the_region) => {
  let play_path = current_path
    .filter((element) => element[2] < the_region[2])
    .concat([the_region]);
  // TODO: loading screen
  getPlayData(play_path).then((borders) => {
    names = borders.features.map(
      (f) => f.properties["name:en"] || f.properties["name"],
    );
    shuffleArray(names);
    maxscore = names.length * 3; // TODO: change if we change the scoring system
    navScreen.classList.add("hidden");
    mapScreen.classList.remove("hidden");
    const key = "qkOKp14TlTpS6tZnCYBN";
    const map = L.map("map").setView([0, 0], 1);
    const baseLayer = L.maptilerLayer({
      apiKey: key,
      style: "f60f30f5-cbe5-4499-8672-25dc30a2a5d1",
    }).addTo(map);
    nextName();
    let handleClick = (e) => {
      if (e.target._path.getAttribute("data-chosen") == "true") {
        return;
      }
      let props = e.target.feature.properties;
      let this_name = props["name:en"] || props["name"];
      if (this_name == names[0]) {
        names = names.slice(1);
        score += tries;
        e.target.setStyle({ color: "green", fillOpacity: 0.7 }); // TODO: sort out colours properly
        e.target._path.setAttribute("data-chosen", "true");
        if (names.length == 0) {
          gameOver();
        } else {
          nextName();
        }
      } else {
        if (tries > 0) tries -= 1;
        e.target._path.setAttribute("data-flashing", "true");
        e.target.setStyle({ color: "red" });
        setTimeout(() => {
            e.target._path.setAttribute("data-flashing", "false");
            e.target.setStyle({ color: "#3388ff" });
        }, 500);
        if (tries == 0) {
          hint();
        }
      }
    };
    let geoj = L.geoJSON(borders, {
      onEachFeature: (feature, layer) => {
        layer.on({ click: handleClick });
        layer.on({ mouseover: () => {if (layer._path.getAttribute("data-chosen") != "true" && layer._path.getAttribute("data-flashing") != "true") layer.setStyle({color: "#3a33ff"})} });
        layer.on({ mouseout: () => {if (layer._path.getAttribute("data-chosen") != "true" && layer._path.getAttribute("data-flashing") != "true") layer.setStyle({color: "#3388ff"})} });
        nameLayerDict[
          feature.properties["name:en"] || feature.properties["name"]
        ] = layer;
      },
    }).addTo(map);
    map.fitBounds(geoj.getBounds());
  });
};

const expandRegion = (the_region, col) => {
  current_path = current_path.slice(0, col);
  active_nav_items.slice(col).forEach((elem) => {
    elem.classList.remove("active");
  });
  active_nav_items = active_nav_items.slice(0, col);
  while (navRow.childElementCount > col + 1) {
    navRow.removeChild(navRow.lastElementChild);
  }
  // TODO: loading screen
  getRegions(current_path.concat([the_region])).then((the_list) => {
    // TODO: remove loading screen
    if (the_region.length != 0) {
      current_path.push(the_region);
    }
    addRegionList(the_list, col + 1);
  });
};

/*
const addRegionList = (the_list) => {
    let the_col = document.createElement("div");
    the_col.classList.add("col");

    let addElements = (rest) => {
        if (rest.length == 0) return;
        let element = rest[0];
        console.log(element);
        return getRegions(current_path.concat([element])).then(data => {
            if (data.length != 0) {
                let the_item = document.createElement("div");
                the_item.classList.add("nav-item");

                let the_name = document.createElement("span");
                the_name.classList.add("nav-name");
                the_name.innerText = element[0];
                the_item.appendChild(the_name);

                if (element[2] > 1) {
                    let the_button = document.createElement("button");
                    the_button.classList.add("btn");
                    the_button.classList.add("btn-outline-dark");
                    the_button.classList.add("nav-play");
                    the_button.innerText = "Play";
                    the_button.addEventListener("click", () => {
                        playRegion(element);
                    })
                    the_item.appendChild(the_button);
                }

                let checkExpandability = (subregions) => {
                    if (subregions.length == 0) {
                        // none of the subregions had children, append without the arrow
                        the_col.appendChild(the_item);
                        return;
                    }
                    let subelement = subregions[0];
                    console.log(subelement);
                    return getRegions(current_path.concat([element, subelement])).then(data => {
                        if (data.length != 0) {
                            // TODO: if at least one of this region's subregions has its own subregions, render the arrow
                            let the_arrow = document.createElement("button");
                            the_arrow.classList.add("btn");
                            the_arrow.classList.add("btn-outline-secondary");
                            the_arrow.classList.add("nav-expand");
                            the_arrow.innerHTML = "<i class=\"bi bi-chevron-right\"></i>";
                            the_arrow.addEventListener("click", () => {
                                the_item.classList.add("active");
                                active_nav_items.push(the_item);
                                expandRegion(element);
                            });
                            the_item.appendChild(the_arrow);

                            the_col.appendChild(the_item);
                            return;
                        } else {
                            return checkExpandability(subregions.slice(1));
                        }
                    });
                }
                return checkExpandability(data);
            }
        }).then(() => {addElements(rest.slice(1))});
    }

    addElements(the_list).then(() => {
        // any other formatting for the column, adding a header etc.
        navRow.appendChild(the_col);
    })
}
*/

const addRegionList = (the_list, col) => {
  let the_col = document.createElement("div");
  the_col.classList.add("col");

  the_list.forEach((element) => {
    let the_item = document.createElement("div");
    the_item.classList.add("nav-item");

    let the_name = document.createElement("span");
    the_name.classList.add("nav-name");
    the_name.innerText = element[0];
    the_item.appendChild(the_name);

    if (element[2] > 1) {
      let the_button = document.createElement("button");
      the_button.classList.add("btn");
      the_button.classList.add("btn-outline-dark");
      the_button.classList.add("nav-play");
      the_button.innerText = "Play";
      the_button.addEventListener("click", () => {
        playRegion(element);
      });
      the_item.appendChild(the_button);
    }

    let the_arrow = document.createElement("button");
    the_arrow.classList.add("btn");
    the_arrow.classList.add("btn-outline-secondary");
    the_arrow.classList.add("nav-expand");
    the_arrow.innerHTML = '<i class="bi bi-chevron-right"></i>';
    the_arrow.addEventListener("click", () => {
      expandRegion(element, col);
      the_item.classList.add("active");
      active_nav_items.push(the_item);
    });
    the_item.appendChild(the_arrow);

    the_col.appendChild(the_item);

    // any other formatting for the column, adding a header etc.
    navRow.appendChild(the_col);
  });
};

window.addEventListener("load", () => {
  addRegionList(continents, 0);
});

// var geojsonFeature = {
//     "type": "Feature",
//     "properties": {
//         "name": "Coors Field",
//         "amenity": "Baseball Stadium",
//         "popupContent": "This is where the Rockies play!"
//     },
//     "geometry": {
//         "type": "Point",
//         "coordinates": [-104.99404, 39.75621]
//     }
// };

// var admin_layer = L.geoJSON().addTo(map);
// admin_layer.addData(geojsonFeature);
