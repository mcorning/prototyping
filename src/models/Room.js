import { Model } from '@vuex-orm/core';

export default class Room extends Model {
  static entity = 'rooms';
  static primaryKey = 'roomId';

  static fields() {
    return {
      // id: this.number(0), // without a fvixed id, update() creates a record
      roomId: this.string(''),
    };
  }

  static async update(val) {
    let p = await this.$update({
      data: { roomId: val },
    });
    return p;
  }
}
