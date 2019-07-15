import AreaEntranceSeparator from "./Constants/AreaEntranceSeparator";
import PromptForHouseEntrance from "./PromptForHouseEntrance";
import EntranceTypes from "./DataObjects/EntranceTypes";
import LocalStorage from "./Constants/LocalStorage";
import Hyrule from "./DataObjects/Hyrule";
import AreasToAdd from "./DataObjects/AreasToAdd";
import Grottos from "./DataObjects/Grottos";
import Houses from "./DataObjects/Houses";
import Songs from "./DataObjects/Songs";
import Menu from "./DataObjects/Menu";
import React from "react";
import Area from "./Area";
import Song from "./Song";
import Entrance from "./Entrance";
import OverworldAreas from "./DataObjects/OverworldAreas";

export default class ZOoTREntranceTracker extends React.Component {

    state = {
        hyrule: {}, // master world state
        interiorEntrances: {}, // area/interior keys access array of location objects
        availableEntrances: {}, // area key accesses array of entrances
        availableOverworldEntrances: {}, // area key accesses array of overworld entrances
        availableDungeons: [], // dungeons not yet assigned to dungeon entrance
        availableHouses: [], // houses not yet assigned to house entrance
        availableHouseEntrances: {},
        availableGrottos: [], // grottos not yet assigned to grotto entrance
        openAreas: [], // the areas that can currently be accessed
        songs: {} // songs state
    };

    setupTracker = () => {

        let hyrule = Hyrule; // master world state
        let interiorEntrances = {}; // area/interior keys access array of location objects
        let availableEntrances = {}; // area key accesses array of entrances
        let availableOverworldEntrances = {}; // available entrances of type Overworld
        let availableDungeons = []; // dungeons not yet assigned to dungeon entrance
        let availableHouses = []; // houses not yet assigned to house entrance
        let availableHouseEntrances = {}; // areas and the houses within them
        let availableGrottos = []; // grottos not yet assigned to grotto entrance
        let openAreas = []; // the areas that can currently be accessed
        let songs = Songs; // songs state

        Object.keys(Hyrule).forEach(area => {
            availableEntrances[area] = [];
            availableOverworldEntrances[area] = [];

            Object.keys(Hyrule[area].entrances).forEach(entranceName => {

                availableEntrances[area].push(entranceName);
                let entrance = Hyrule[area].entrances[entranceName];
                let type = entrance.type;

                if (type === EntranceTypes.Overworld) {
                    availableOverworldEntrances[area].push(entranceName);
                } else if (type === EntranceTypes.Dungeon) {
                    availableDungeons.push(entranceName);
                } else {
                    let displayName = entrance.display || entranceName;

                    if (type === EntranceTypes.House) {
                        availableHouses.push(displayName);
                        if (availableHouseEntrances[area] === undefined) {
                            availableHouseEntrances[area] = [];
                        }
                        availableHouseEntrances[area].push(entranceName);
                    } else if (type === EntranceTypes.Grotto) {
                        availableGrottos.push(displayName);
                    }
                }
            });
        });

        this.setState({
            hyrule: hyrule,
            interiorEntrances: interiorEntrances,
            availableEntrances: availableEntrances,
            availableOverworldEntrances: availableOverworldEntrances,
            availableDungeons: availableDungeons,
            availableHouses: availableHouses,
            availableHouseEntrances: availableHouseEntrances,
            availableGrottos: availableGrottos,
            openAreas: openAreas,
            songs: songs
        });
    };

    houseToPromptForBasedOnState = () => {
        let interiorEntrances = this.state.interiorEntrances;
        let songs = this.state.songs;
        if (interiorEntrances[Houses.LinksHouse] === undefined) {
            return Houses.LinksHouse;
        } else if (interiorEntrances[Grottos.DampesGrave] !== undefined &&
            interiorEntrances[Houses.Windmill] === undefined) {
            return Houses.Windmill;
        } else if (songs["Prelude of Light"].collected &&
            interiorEntrances[Houses.TempleOfTime].length === 1) {
            return Houses.TempleOfTime;
        }
        return null;
    };

    returnUniqueItems = array => {
        return array.filter((item, i) => {
            return array.indexOf(item) === i;
        });
    };

    saveState = () => {
        let state = this.state;
        localStorage.setItem(LocalStorage.state, JSON.stringify(state));
    };

    loadState = () => {
        let stringState = localStorage.getItem(LocalStorage.state);
        let state = JSON.parse(stringState);
        if (state) {
            this.setState(state);
        }
    };

    resetState = () => {
        localStorage.removeItem(LocalStorage.state);
        this.setupTracker();
    };

    addInteriorEntrance = (location, entranceObject) => {
          let interiorEntrances = this.state.interiorEntrances;
          if (interiorEntrances[location] === undefined) {
              interiorEntrances[location] = [];
          }
          interiorEntrances[location].push(entranceObject);
          this.setState({interiorEntrances});
    };

    addAdditionalAreas = area => {
        let hyrule = this.state.hyrule;
        if (AreasToAdd[area] !== undefined) {
            AreasToAdd[area].forEach(addOnArea => {
                hyrule[addOnArea].isAccessible = true;
            })
        }
        this.setState({hyrule});
    };

    removeAdditionalAreas = area => {
        if (AreasToAdd[area] !== undefined) {
            AreasToAdd[area].forEach(addOnArea => {
                this.removeAreaIfEmpty(addOnArea);
            });
        }
    };

    setOverworldEntrance = (area, entrance, obj) => {
        let hyrule = this.state.hyrule;
        hyrule[area].entrances[entrance].leadsTo = obj;
        this.setState({hyrule});
    };

    setAreaToAccessible = area => {
        let hyrule = this.state.hyrule;
        hyrule[area].isAccessible = true;
        this.setState({hyrule});
    };

    acquireSong = song => {
        let songs = this.state.songs;
        songs[song].collected = true;
        if (songs[song].areaType === EntranceTypes.Overworld) {
            this.setAreaToAccessible(songs[song].area);
        }
        this.addInteriorEntrance(songs[song].area, {song});
        this.addAdditionalAreas(songs[song].area);
        this.setState({songs});
    };

    removeInteriorEntrance = (type, location, entranceObject) => {
        let interiorEntrances = this.state.interiorEntrances;
        interiorEntrances[location] = interiorEntrances[location].filter(entrance => {
            if (type === EntranceTypes.Song) {
                return entrance.song !== entranceObject.song;
            } else {
                return entrance.area !== entranceObject.area ||
                    entrance.entrance !== entranceObject.entrance;
            }
        });
        if (interiorEntrances[location].length === 0) {
            delete interiorEntrances[location];
        }
        this.setState({interiorEntrances});
    };

    removeSong = song => {
        let songs = this.state.songs;
        songs[song].collected = false;
        if (songs[song].areaType === EntranceTypes.Overworld) {
            this.removeAreaIfEmpty(songs[song].area);
        }
        this.removeInteriorEntrance(EntranceTypes.Song, songs[song].area, {song});
        this.setState({songs});
    };

    setKaeporaLanding = (sourceArea, destinationArea) => {
        let hyrule = this.state.hyrule;
        if (sourceArea === OverworldAreas.DeathMountainTrail) {
            hyrule[destinationArea].hasKaeporaDeathMountainTrailLanding = true;
        } else if (sourceArea === OverworldAreas.LakeHylia) {
            hyrule[destinationArea].hasKaeporaLakeHyliaLanding = true;
        }
        this.setState({hyrule});
    };

    removeKaeporaLanding = (sourceArea, destinationArea) => {
        let hyrule = this.state.hyrule;
        if (sourceArea === OverworldAreas.DeathMountainTrail) {
            hyrule[destinationArea].hasKaeporaDeathMountainTrailLanding = false;
        } else if (sourceArea === OverworldAreas.LakeHylia) {
            hyrule[destinationArea].hasKaeporaLakeHyliaLanding = false;
        }
        this.setState({hyrule});
    };

    setInterior = (area, entrance, interior) => {
        let hyrule = this.state.hyrule;
        hyrule[area].entrances[entrance].interior = interior;
        this.setState({hyrule});
    };

    resetOverworldEntrance = (area, entrance) => {
        let hyrule = this.state.hyrule;
        hyrule[area].entrances[entrance].leadsTo = null;
        this.setState({hyrule});
    };

    removeOverworldEntranceFromPool = (area, entrance) => {
        let availableOverworldEntrances = this.state.availableOverworldEntrances;
        availableOverworldEntrances[area].splice(availableOverworldEntrances[area].indexOf(entrance), 1);
        this.setState({availableOverworldEntrances});
    };

    removeInteriorFromPool = (type, interior) => {
        let array;
        if (type === EntranceTypes.House) {
            array = this.state.availableHouses;
        } else if (type === EntranceTypes.Dungeon) {
            array = this.state.availableDungeons;
        } else if (type === EntranceTypes.Grotto) {
            array = this.state.availableGrottos;
        }
        if (!array) {
            return;
        }
        array.splice(array.indexOf(interior), 1);
        this.setState({[`available${type}s`]: array});
    };

    addInteriorBackIntoPool = (type, interior) => {
        let array;
        if (type === EntranceTypes.House) {
            array = this.state.availableHouses;
        } else if (type === EntranceTypes.Dungeon) {
            array = this.state.availableDungeons;
        } else if (type === EntranceTypes.Grotto) {
            array = this.state.availableGrottos;
        }
        if (!array) {
            return;
        }
        array.push(interior);
        this.setState({[`available${type}s`]: array});
    };

    resetInterior = (area, entrance) => {
        let hyrule = this.state.hyrule;
        hyrule[area].entrances[entrance].interior = null;
        this.setState({hyrule});
    };

    addOverworldEntranceBackIntoPool = (area, entrance) => {
        let availableOverworldEntrances = this.state.availableOverworldEntrances;
        availableOverworldEntrances[area].push(entrance);
        this.setState({availableOverworldEntrances});
    };

    removeAreaIfEmpty = areaName => {
        let hyrule = this.state.hyrule;
        let area = hyrule[areaName];
        if (area.hasKaeporaLakeHyliaLanding || area.hasKaeporaDeathMountainTrailLanding) {
            return;
        }
        let empty = true;
        Object.keys(area.entrances).forEach(key => {
            let entrance = area.entrances[key];
            if (entrance.interior !== undefined && entrance.interior !== null) {
                empty = false;
            } else if (entrance.leadsTo !== undefined && entrance.leadsTo !== null) {
                empty = false;
            }
        });
        if (empty) {
            hyrule[areaName].isAccessible = false;
            if (AreasToAdd[areaName] !== undefined) {
                AreasToAdd[areaName].forEach(name => {
                    this.removeAreaIfEmpty(name);
                });
            }
        }
        this.setState({hyrule});
    };

    resetEntrance = (entranceObj) => {
        switch (entranceObj.type) {
            case EntranceTypes.Overworld: {
                let area = entranceObj.area;
                let entrance = entranceObj.entrance;
                let leadsToArea = entranceObj.leadsTo.area;
                let leadsToEntrance = entranceObj.leadsTo.entrance;
                this.resetOverworldEntrance(area, entrance);
                this.resetOverworldEntrance(leadsToArea, leadsToEntrance);

                this.addOverworldEntranceBackIntoPool(area, entrance);
                this.addOverworldEntranceBackIntoPool(leadsToArea, leadsToEntrance);

                this.removeInteriorEntrance(entranceObj.type, area, entranceObj.leadsTo);
                this.removeInteriorEntrance(entranceObj.type, leadsToArea, entranceObj);

                this.removeAreaIfEmpty(area);
                this.removeAreaIfEmpty(leadsToArea);
                break;
            }
            case EntranceTypes.Grotto:
            case EntranceTypes.House:
            case EntranceTypes.Dungeon: {
                let area = entranceObj.area;
                let entrance = entranceObj.entrance;
                let interior = entranceObj.interior;
                this.resetInterior(area, entrance);
                this.addInteriorBackIntoPool(entranceObj.type, interior);
                this.removeInteriorEntrance(entranceObj.type, interior, entranceObj);
                this.removeAreaIfEmpty(area);
                this.removeAdditionalAreas(interior);
                break;
            }
            case EntranceTypes.KaeporaGaebora: {
                let area = entranceObj.area;
                let leadsToArea = entranceObj.leadsTo.area;

                this.removeKaeporaLanding(area, leadsToArea);
                this.resetOverworldEntrance(area, entranceObj.entrance);

                this.removeInteriorEntrance(entranceObj.type, leadsToArea, entranceObj);

                this.removeAreaIfEmpty(area);
                this.removeAreaIfEmpty(leadsToArea);
                break;
            }
            default: {
                throw Error("Invalid type: " + entranceObj.type);
            }
        }
    };

    setEntrance = (vanilla, selection) => {
        switch (vanilla.type) {
            case EntranceTypes.Overworld: {
                let area = vanilla.area;
                let entrance = vanilla.entrance;
                let selectedArea = selection.area;
                let selectedEntrance = selection.entrance;

                this.setOverworldEntrance(area, entrance, {area: selectedArea, entrance: selectedEntrance});
                this.setOverworldEntrance(selectedArea, selectedEntrance, {area, entrance});

                this.addInteriorEntrance(area, {area: selectedArea, entrance: selectedEntrance});
                this.addInteriorEntrance(selectedArea, {area, entrance});

                this.setAreaToAccessible(area);
                this.setAreaToAccessible(selectedArea);

                this.removeOverworldEntranceFromPool(area, entrance);
                this.removeOverworldEntranceFromPool(selectedArea, selectedEntrance);

                this.addAdditionalAreas(area);
                this.addAdditionalAreas(selectedArea);
                break;
            }
            // grottos, houses, and dungeons all
            // use the same 'interior' attribute
            case EntranceTypes.Grotto:
            case EntranceTypes.House:
            case EntranceTypes.Dungeon: {
                let area = vanilla.area;
                let entrance = vanilla.entrance;
                let interior = selection.interior;

                this.setInterior(area, entrance, interior);
                this.setAreaToAccessible(area);

                this.removeInteriorFromPool(vanilla.type, interior);

                this.addInteriorEntrance(interior, {area, entrance});
                this.addAdditionalAreas(interior);
                break;
            }
            case EntranceTypes.KaeporaGaebora: {
                let area = vanilla.area;
                let entrance = vanilla.entrance;
                let selectedArea = selection.area;

                this.setOverworldEntrance(area, entrance, {area: selectedArea});

                this.setKaeporaLanding(area, selectedArea);

                this.setAreaToAccessible(selectedArea);

                this.addInteriorEntrance(selectedArea, {area, entrance});
                this.addAdditionalAreas(selectedArea);
                break;
            }
            default: {
                throw Error("Invalid type: " + vanilla.type);
            }
        }
    };

    componentDidMount() {
        this.setupTracker();
        this.loadState();
    };

    render() {
        let hyrule = this.state.hyrule;
        let houseToPromptFor = this.houseToPromptForBasedOnState();
        let songs = this.state.songs;

        return (
            <div className="zootr-entrance-tracker">
                {/* search section */}
                {/* from a currently active location to another currently active location only */}

                <Menu
                    saveState={this.saveState}
                    resetState={this.resetState}
                />

                <div className="top-padding" />
                <div className="user-prompts">
                    {houseToPromptFor !== null ?
                        <PromptForHouseEntrance
                            houseToPromptFor={houseToPromptFor}
                            availableHouseEntrances={this.state.availableHouseEntrances}
                            setEntrance={this.setEntrance}
                        />
                        : ""
                    }
                </div>


                <div className="areas-container is-flex-desktop is-flex-tablet is-multiline flex-wraps">
                    {/* iterate through the areas of Hyrule */}
                    {hyrule !== undefined && Object.keys(hyrule).sort().map((areaName, i) => {
                        // get the current areas object from state
                        let area = Hyrule[areaName];
                        // if it's not accessible, we don't want to display it
                        if (!area.isAccessible) {
                            return null;
                        }
                        // area entrances shown in two columns
                        // to prevent extremely tall areas
                        let firstCol = [];
                        let secondCol = [];
                        return <div className="area-box box" key={i}
                            style={{
                                // set border to selected colors
                                // default solid grey
                                background: area.colors.length > 1 ?
                                    `linear-gradient(to bottom right, ${area.colors.join(", ")}`
                                    : area.colors.length === 1 ?
                                        area.colors.length[0]
                                        : "grey"
                            }}
                        >
                            <div className="box">
                                <h4 className="is-size-4 has-text-weight-semibold">{areaName}</h4>
                                {/* iterate through the entrances of the area */}
                                {Object.keys(area.entrances).sort().map((entranceName, j) => {
                                    // column layout
                                    let entrancesLength = Object.keys(area.entrances).length;
                                    let arrayToAddTo = j < entrancesLength / 2 ? firstCol : secondCol;
                                    // entrance object derived from the area object
                                    let entrance = area.entrances[entranceName];
                                    // the type of entrance determines what
                                    // options are displayed to pick from
                                    let options = entrance.type === EntranceTypes.House ?
                                        this.returnUniqueItems(this.state.availableHouses)
                                            : entrance.type === EntranceTypes.Dungeon ?
                                            this.state.availableDungeons
                                                : entrance.type === EntranceTypes.Overworld ?
                                                this.state.availableOverworldEntrances
                                                    : entrance.type === EntranceTypes.Grotto ?
                                                    this.returnUniqueItems(this.state.availableGrottos)
                                                        : entrance.type === EntranceTypes.KaeporaGaebora ?
                                                        Object.keys(hyrule).sort()
                                                            : []; // How did you get here??

                                    // add to the correct column in area container
                                    arrayToAddTo.push(
                                        <div className="entrance" key={j}>
                                            <h6 className={
                                                "is-size-6 has-text-weight-semibold " +
                                                // entrance has no assignment, make it clear
                                                (entrance.interior === null || entrance.leadsTo === null ? "has-text-danger" : "")
                                            }>{entranceName}</h6>
                                            {entrance.interior !== undefined && entrance.interior !== null ?
                                                // has an interior defined, so just display it
                                                <div className="interior-display is-flex">
                                                    <span>
                                                        {entrance.interior}
                                                    </span>
                                                    {/* x icon for resetting an entrance to unchecked */}
                                                    {/* but once Link's House is set, leave it */}
                                                    {entrance.interior === Houses.LinksHouse ?
                                                        "" :
                                                        <span className="delete is-pulled-right" onClick={
                                                            () => this.resetEntrance({...entrance, area: areaName, entrance: entranceName})
                                                        } />
                                                    }
                                                </div>
                                                :
                                                entrance.leadsTo !== undefined && entrance.leadsTo !== null
                                                ?
                                                // points to an area, and maybe an entrance
                                                <div className="interior-display is-flex">
                                                    <span>
                                                        {/* show area at least */}
                                                        {entrance.leadsTo.area}
                                                        {/* show entrance if defined */}
                                                        {entrance.leadsTo.entrance !== undefined &&
                                                            <div>{entrance.leadsTo.entrance} Entrance</div>
                                                        }
                                                    </span>
                                                    <span className="delete is-pulled-right" onClick={
                                                        () => this.resetEntrance({...entrance, area: areaName, entrance: entranceName})
                                                    } />
                                                </div>
                                                :
                                                // no interior or area is set, so display available options to select
                                                <div className="select is-small entrance-select">
                                                    <select value="Not Checked" onChange={event =>
                                                        this.setEntrance(
                                                            // the area and entrance and type that is being assigned
                                                            // used to determine steps to take in this.setEntrance
                                                            {
                                                                area: areaName,
                                                                entrance: entranceName,
                                                                type: entrance.type
                                                            },
                                                            // object that has interior key for houses, grottos, dungeons
                                                            // or area and entrance keys for overworld and kaepora gaebora
                                                            JSON.parse(event.target.value)
                                                        )
                                                    }>
                                                        <option value="Not Checked">Not Checked</option>
                                                        {options instanceof Array ?
                                                            // if its an array, it's areas, houses, or grottos
                                                            // map over them and make them options
                                                            options.sort().map((interiorName, k) => {
                                                                let objKey = entrance.type === EntranceTypes.KaeporaGaebora ? "area" : "interior";
                                                                return <option key={k} value={JSON.stringify({[objKey]: interiorName})}>
                                                                    {interiorName}
                                                                </option>
                                                            })
                                                            :
                                                            // it's an overworld selection
                                                            // iterate through the area keys and make them optGroups
                                                            // make the entrance of that area selection options
                                                            Object.keys(options).sort().map((optgroupArea, k) => {
                                                                // don't make optGroups for empty areas
                                                                // also don't show empty optGroup if it's
                                                                // only entrance is the current entrance
                                                                if (options[optgroupArea].length === 0 ||
                                                                    (options[optgroupArea].length === 1 &&
                                                                        options[optgroupArea][0] === entranceName)) {
                                                                    return null;
                                                                }
                                                                return <optgroup
                                                                    key={k}
                                                                    label={optgroupArea}
                                                                >
                                                                    {options[optgroupArea].map((optgroupEntrance, l) => {
                                                                        // don't show current entrance as selectable option
                                                                        if (areaName === optgroupArea && entranceName === optgroupEntrance) {
                                                                            return null;
                                                                        }
                                                                        return <option
                                                                            key={l}
                                                                            value={JSON.stringify({
                                                                                area: optgroupArea,
                                                                                entrance: optgroupEntrance
                                                                            })}
                                                                        >
                                                                            {optgroupEntrance}
                                                                        </option>
                                                                    })}
                                                                </optgroup>
                                                            })
                                                        }
                                                    </select>
                                                </div>
                                            }
                                        </div>
                                    );
                                    return null;
                                })}
                                {/* output the columns of area entrances */}
                                <div className="columns">
                                    <div className="column">
                                        {firstCol}
                                    </div>
                                    {secondCol.length > 0 ?
                                        <div className="column">
                                            {secondCol}
                                        </div>
                                        : ""
                                    }
                                </div>
                            </div>
                        </div>
                    })}
                </div>

                <div className="bottom-padding" />

                {/* display songs that can be collected and may open new areas */}
                <div className="songs-container navbar is-fixed-bottom has-background-dark">
                    {Object.keys(songs).map((song, i) => {
                        return <Song
                            key={i}
                            song={songs[song]}
                            acquireSong={this.acquireSong}
                            removeSong={this.removeSong}
                        />
                    })}
                </div>
            </div>
        );
    }
}
