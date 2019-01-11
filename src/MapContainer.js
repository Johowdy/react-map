import React, { Component } from 'react';
import LocationsList from './LocationsList';
import env from './Keys';

class MapContainer extends Component {
  state = {
    selectedLocation: null,
    locations: []
  }

  initGoogleMaps() {
    if (!this.mapsPromise) {
      this.mapsPromise = new Promise((resolve) => {
        window.resolveGoogleMaps = () => {
          resolve(window.google);

          delete window.resolveGoogleMaps;
        };

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${env.mapsApiKey}&callback=resolveGoogleMaps&libraries=places`;
        script.async = true;
        document.body.appendChild(script);
      })
    }
    return this.mapsPromise;
  };

  componentWillMount() {
    this.initGoogleMaps();
  }

  componentDidMount() {
    this.initGoogleMaps().then((google) => {
      this.map = new google.maps.Map(document.getElementById('map'), {zoom: 11});
      this.infoWindow = new google.maps.InfoWindow();
      this.geocoder = new google.maps.Geocoder();
      this.geocoder.geocode({address: 'El Paso, TX'}, (results, status) => {
        if (status === 'OK') {
          this.map.setCenter(results[0].geometry.location);
          this.populateVets();
        } else {
          alert('could not geocode El Paso: '+status);
        }
      })
    })
  }

  populateVets() {
    this.placesService = new window.google.maps.places.PlacesService(this.map);

    fetch('https://api.yelp.com/v3/businesses/search?term=vet&location="el paso, tx"', {
      headers: {
        Bearer: `${env.yelpKey}`
      }
    })
    .then(res => {
      console.log(`yelp results: ${res}`);
      return res.json();
    })

/*
    this.placesService.textSearch({query: 'vet in El Paso, TX'}, (results, status) => {
      this.setState({locations:results});
      this.markers = [];
      for(let i = 0; i < results.length; i++) {
        const vet = results[i];
        setTimeout(() => {
          const marker = new window.google.maps.Marker({
            position: vet.geometry.location,
            map: this.map,
            title: vet.name,
            vetId: vet.id,
            animation: window.google.maps.Animation.DROP
          });
          marker.addListener('click', () => {
            this.selectLocation(vet);
          });
          this.markers.push(marker);
        }, i * 200);
      }
    })
    */
  }

  selectLocation(location) {
    const { selectedLocation } = this.state;
    if (selectedLocation && selectedLocation.id === location.id) {
      this.setState({selectedLocation: null})
      this.infoWindow.close();
    } else {
      this.setState({selectedLocation: location});
      const marker = this.markers.find(marker => {
        return marker.vetId === location.id;
      });

      const photoUrl = location.photos && location.photos[0] && location.photos[0] ? location.photos[0].getUrl() : null;
      const photoTag = photoUrl ? `\n<br/>\n<img src="${photoUrl}"/>` : '';

      this.infoWindow.setContent(`${location.name}\n<br/>\n${location.formatted_address}${photoTag}`);
      this.infoWindow.open(this.map, marker);
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(((marker) => {
        marker.setAnimation(null);
      })(marker), 500);
    }
  }

  render() {
    const { locations, selectedLocation } = this.state;
    return (
      <div id="map-container">
        <div id="header">
          Vets in El Paso, Tx
        </div>
        <LocationsList locations={locations} selectedLocation={selectedLocation} selectLocation={location => this.selectLocation(location)} />
        <div id="map">...Loading...</div>
      </div>
    )
  }
}

export default MapContainer;
