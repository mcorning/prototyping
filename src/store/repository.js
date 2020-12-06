import State from '@/models/State';
import Room from '@/models/Room';

// using the query builder, we can easily get the specific data
// we need in our components
export default class DataRepository {
  static async getState() {
    let fetched = await State.$fetch();
    if (fetched.state?.length) {
      let state = fetched.state[0];
      return state;
    } else {
      console.log('Creating state object...');
      let states = await State.$create({
        data: {
          id: 0,
          organization: '',
          roomId: '',
          yourId: '',
          managerId: 'Taolette',
          defaultVue: 'visitor',
          zipcode: '',
          incubationPeriod: '',
        },
      });

      return states[0];
    }
  }
  static async getRooms() {
    let fetched = await Room.$fetch();
    if (fetched.rooms?.length) {
      let rooms = fetched.rooms[0];
      return rooms;
    }
  }
}
