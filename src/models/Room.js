import { Model } from '@vuex-orm/core';
import base64id from 'base64id';

export default class Room extends Model {
  static entity = 'rooms';
  static primaryKey = 'id';

  static fields() {
    return {
      room: this.string(''),
      id: this.string(''),
      nsp: this.string('/'),
      onboarded: this.string(Date.now()),
    };
  }

  static async update(room, id, nsp) {
    if (!id) {
      id = base64id.generateId();
    }
    console.log(`Updating room ${room}`);
    let p = await this.$create({
      data: { room: room, id: id, nsp: nsp },
    });
    console.log('INSIDE ROOM: ', p);
    return p;
  }
  static async delete(val) {
    console.log('Deleting Room ID', val);
    await this.$delete(val);
  }
}
