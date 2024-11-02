const dummyRegions = [["United Kingdom", "UK", 2], ["France", "FR", 2], ["Germany", "DE", 2], ["China", "CN", 2], ["Faerun", "FA", 2]];

const navScreen = document.getElementById("nav-screen");
const mapScreen = document.getElementById("map-screen");
const navRow = document.getElementById("nav-row");

let current_path = [];
let active_nav_items = [];

const getRegions = (path) => {
    return new Promise((res, rej) => {
        if (path.length == 0) {
            res(dummyRegions)
        } else {
            console.log(path);
            let new_level = path[path.length - 1][2] + 1;
            console.log(new_level);
            res(dummyRegions.map(elem => [elem[0], elem[1], new_level]));
        }
    });
}

const playRegion = (the_region) => {
    let play_path = current_path.filter(element => element[2] < the_region[2]).concat([the_region]);
    console.log(play_path)
    // TODO: loading screen
    getPlayData(play_path).then((the_data) => {
        // TODO: put data in the map screen
        // TODO: wait for the map screen to finish loading
            // TODO: remove loading screen
            // TODO: hide the nav screen and show the map screen
    });
}

const expandRegion = (the_region) => {
    while (current_path.length > 0 && current_path[current_path.length-1][2] >= the_region[2]) {
        current_path.pop();
        active_nav_items.pop();
        navRow.removeChild(navRow.lastChild);
    }
    // TODO: loading screen
    getRegions(current_path.concat([the_region])).then((the_list) => {
        // TODO: remove loading screen
        if (the_region.length != 0) {
            current_path.push(the_region);
        }
        addRegionList(the_list)
    });
}

const addRegionList = (the_list) => {
    let the_col = document.createElement("div");
    the_col.classList.add("col");

    // any other formatting for the column, adding a header etc.

    the_list.forEach(element => {
        let the_item = document.createElement("div");
        the_item.classList.add("nav-item");
        
        let the_name = document.createElement("span");
        the_name.classList.add("nav-name");
        the_name.innerText = element[0];
        the_item.appendChild(the_name);

        let the_button = document.createElement("button");
        the_button.classList.add("btn");
        the_button.classList.add("btn-outline-dark");
        the_button.classList.add("nav-play");
        the_button.innerText = "Play";
        the_button.addEventListener("click", () => {
            playRegion(element);
        })
        the_item.appendChild(the_button);

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
    });

    navRow.appendChild(the_col);
}


window.addEventListener("load", () => {
    expandRegion(["World", "", 1]);
});
