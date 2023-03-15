import "./App.css";
import React from "react";

class SearchBar extends React.Component {
    render() {
        const { value, onChange, onSubmit, children } = this.props;
        return (
            <form className="form-group" onSubmit={onSubmit}>
                <input type="text" value={value} onChange={onChange} />
                <button>{children}</button>
            </form>
        );
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchedStation: "",
            selectedStation: undefined,
            error: null,
            isLoaded: false,
            items: [],
            errorData: null,
            isLoadedData: false,
            itemData: {},
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleResult = this.handleResult.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleResultData = this.handleResultData.bind(this);
        this.handleErrorData = this.handleErrorData.bind(this);
    }

    handleChange(e) {
        e.preventDefault();
        this.setState({
            searchedStation: e.target.value,
        });
    }
    handleSubmit(e) {
        e.preventDefault();
    }

    handleResult(result) {
        this.setState({
            isLoaded: true,
            items: result,
        });
    }
    handleResultData(result) {
        this.setState({
            isLoadedData: true,
            itemData: result,
        });
    }
    handleError(error) {
        this.setState({
            isLoaded: true,
            error,
        });
    }
    handleErrorData(error) {
        this.setState({
            isLoadedData: true,
            errorData: error,
        });
    }
    handleClick(e) {
        this.setState({
            selectedStation: e.properties,
            searchedStation: e.properties.commune,
        });
    }

    render() {
        const {
            error,
            isLoaded,
            items,
            searchedStation,
            selectedStation,
            errorData,
            isLoadedData,
            itemData,
        } = this.state;
        return (
            <div className="container">
                <nav className="navbar">
                    <h2>Go Surf !</h2>
                    <SearchBar
                        value={(searchedStation, searchedStation)}
                        onChange={this.handleChange}
                        children="Search"
                        onSubmit={this.handleSubmit}
                    />
                </nav>
                <FindSearchedStation
                    onResult={this.handleResult}
                    onError={this.handleError}
                    onClick={this.handleClick}
                    searchedStation={searchedStation}
                    error={error}
                    isLoaded={isLoaded}
                    items={items}
                />
                <CardLocation
                    selectedStation={selectedStation}
                    onResultData={this.handleResultData}
                    onErrorData={this.handleErrorData}
                    errorData={errorData}
                    isLoadedData={isLoadedData}
                    itemData={itemData}
                />
            </div>
        );
    }
}

class FindSearchedStation extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        this.props.onClick(e);
    }

    componentDidMount() {
        fetch(
            "https://www.pigma.org/geoserver/giplit/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=giplit:plages_na-4&outputFormat=application/json&SRSNAME=EPSG:4326&startIndex=0&sortyBy=gid"
        )
            .then((res) => res.json())
            .then(
                (result) => {
                    this.props.onResult(result);
                },
                (error) => {
                    this.props.onError(error);
                }
            );
    }

    render() {
        let { error, isLoaded, items, searchedStation } = this.props;
        if (error) {
            return <div>Erreur : {error.message}</div>;
        } else if (!isLoaded) {
            return <div>Chargement…</div>;
        } else {
            return (
                <div className="find-stations">
                    Liste des plages de Nouvelle-Aquitaine, France :
                    <ul>
                        {items.features.map((item, key) => {
                            if (
                                item.properties.commune
                                    .toLowerCase()
                                    .includes(searchedStation.toLowerCase()) ||
                                item.properties.nom_plage
                                    .toLowerCase()
                                    .includes(searchedStation.toLowerCase())
                            ) {
                                return (
                                    <li
                                        key={key}
                                        onClick={(e) => {
                                            e = item;
                                            this.handleClick(e);
                                        }}
                                    >
                                        {item.properties.commune.toUpperCase()}
                                        <p>{item.properties.nom_plage}</p>
                                    </li>
                                );
                            }
                        })}
                    </ul>
                </div>
            );
        }
    }
}

class CardLocation extends React.Component {
    componentDidUpdate(prevProps) {
        const params =
            "airTemperature,swellHeight,swellPeriod,secondarySwellHeight,secondarySwellPeriod,waterTemperature,waveHeight";
        const start = new Date().toISOString().split("T")[0];
        const end = (function addOneDay() {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            return date.toISOString().split("T")[0];
        })();
        const source = "sg";
        if (prevProps.selectedStation !== this.props.selectedStation) {
            const { selectedStation } = this.props;
            const lat = selectedStation.lat;
            const lng = selectedStation.long;
            fetch(
                `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}&start=${start}&end=${end}&source=${source}`,
                {
                    headers: {
                        Authorization:
                            "cc51ae98-c199-11ed-92e6-0242ac130002-cc51b014-c199-11ed-92e6-0242ac130002",
                        /* eb865bb0-c2a7-11ed-a138-0242ac130002-eb865c1e-c2a7-11ed-a138-0242ac130002
                        ou 
                        cc51ae98-c199-11ed-92e6-0242ac130002-cc51b014-c199-11ed-92e6-0242ac130002
                        */
                    },
                }
            )
                .then((response) => response.json())
                .then((result) => {
                    this.props.onResultData(result);
                });
        }
    }

    render() {
        const { errorData, isLoadedData, itemData, selectedStation } =
            this.props;

        function dataOnHour(object, properties, boolean) {
            const date = new Date();
            const hour = date.getHours();
            const objectOnHour = object.hours[hour];
            if (boolean) {
                return Math.round(objectOnHour[properties].sg);
            }
            return objectOnHour[properties].sg;
        }
        function dataOnTable(object, properties, boolean) {
            const objectOnHour = object[properties].sg;
            if (boolean) {
                return Math.round(objectOnHour);
            }
            return objectOnHour;
        }

        if (errorData) {
            return <div>Erreur : {errorData.message}</div>;
        } else if (!isLoadedData) {
            return (
                <div>
                    Selectionner ou chercher une plage pour voir ses
                    informations :)
                </div>
            );
        } else {
            return (
                <div className="card">
                    <div className="card-header">
                        <h2>{selectedStation.nom_plage}</h2>
                        <p>{selectedStation.commune}</p>
                    </div>
                    <div className="main-infos">
                        <div className="temp-infos">
                            <p>
                                Air :{" "}
                                {dataOnHour(itemData, "airTemperature", true)}°C
                            </p>
                            <p>
                                Sea :{" "}
                                {dataOnHour(itemData, "waterTemperature", true)}
                                °C
                            </p>
                        </div>
                        <div className="minmax">
                            <p>
                                Hauteur de vagues :{" "}
                                {dataOnHour(itemData, "waveHeight")}m
                            </p>
                        </div>
                    </div>
                    <div className="details">
                        <p>
                            Houle primaire actuelle :{" "}
                            {dataOnHour(itemData, "swellHeight")}m en{" "}
                            {dataOnHour(itemData, "swellPeriod", true)}s
                        </p>
                        <p>
                            Houle secondaire actuelle :{" "}
                            {dataOnHour(itemData, "secondarySwellHeight")}m en{" "}
                            {dataOnHour(itemData, "secondarySwellPeriod", true)}
                            s
                        </p>
                    </div>
                    <br />
                    <br />
                    <div className="hourly">
                        <table>
                            <thead>
                                <tr>
                                    <th>Heures</th>
                                    <th>Hauteaur de vagues</th>
                                    <th>Houle primaire</th>
                                    <th>Houle secondaire</th>
                                    <th>Température air</th>
                                    <th>Température eau</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemData.hours.map((hour, keyHour) => {
                                    return (
                                        <tr key={keyHour}>
                                            <th>{keyHour}</th>
                                            <th>
                                                {dataOnTable(
                                                    hour,
                                                    "waveHeight"
                                                )}
                                                m
                                            </th>
                                            <th>
                                                {dataOnTable(
                                                    hour,
                                                    "swellHeight"
                                                )}{" "}
                                                en{" "}
                                                {dataOnTable(
                                                    hour,
                                                    "swellPeriod",
                                                    true
                                                )}
                                                s
                                            </th>
                                            <th>
                                                {dataOnTable(
                                                    hour,
                                                    "secondarySwellHeight"
                                                )}{" "}
                                                en{" "}
                                                {dataOnTable(
                                                    hour,
                                                    "secondarySwellPeriod",
                                                    true
                                                )}
                                                s
                                            </th>
                                            <th>
                                                {dataOnTable(
                                                    hour,
                                                    "airTemperature",
                                                    true
                                                )}{" "}
                                                °C
                                            </th>
                                            <th>
                                                {dataOnTable(
                                                    hour,
                                                    "waterTemperature",
                                                    true
                                                )}{" "}
                                                °C
                                            </th>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    }
}

export default App;
