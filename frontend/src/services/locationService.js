export const locationService = {
    getCurrentLocation: () => {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              reject('Error fetching location:', error);
            }
          );
        } else {
          reject('Geolocation is not supported by this browser.');
        }
      });
    },
  };
  
  export default locationService;
  