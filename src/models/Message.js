import { Model } from '@vuex-orm/core';

export default class Message extends Model {
  static entity = 'messages';

  static fields() {
    return {
      id: this.attr(null),
      room: this.string(''),
      visitor: this.string(''),
      sentTime: this.string(''),
      message: this.string(''),
    };
  }

  // val must be an object
  static async update(val) {
    const { visitor, room, message, sentTime } = val;
    let p = await this.$update({
      data: {
        visitor: visitor,
        room: room,
        dates: message,
        sentTime: sentTime,
      },
    });
    return p;
  }
  static async delete(val) {
    let p = await this.$delete(val);
    return p;
  }
}
