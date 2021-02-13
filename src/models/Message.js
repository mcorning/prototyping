// Docs: https://vuex-orm.org/guide/model/defining-models.html

import { Model } from '@vuex-orm/core';

export default class Message extends Model {
  static entity = 'messages';

  static fields() {
    return {
      id: this.attr(null),
      room: this.string(''),
      roomId: this.string(''),
      visitor: this.string(''),
      visitorId: this.string(''),
      nsp: this.string(''),
      sentTime: this.string(''),
      message: this.string(''),
    };
  }

  // val must be an object
  static async update(val) {
    const {
      id,
      visitor,
      room,
      visitorId,
      roomId,
      nsp,
      message,
      sentTime,
    } = val;
    let p = await this.$create({
      data: {
        id: id,
        room: room,
        roomId: roomId,
        visitor: visitor,
        visitorId: visitorId,
        nsp: nsp,
        message: message,
        sentTime: sentTime,
      },
    });
    return p;
  }

  static async delete(val) {
    let p = await this.$delete(val);
    return p;
  }

  static async deleteAll() {
    let p = await this.$deleteAll();
    return p;
  }

  //   visitorCheckins() {
  //   return this.messages.filter(
  //     (v) =>
  //       v.visitor == this.enabled.visitor.visitor && v.message == 'Entered'
  //   );
  // },
  static visitorCheckins(visitor) {
    console.log(visitor);
    const visitorCheckins = this.query()
      .where((visitor) => {
        return this.visitor === visitor;
      })
      .get();
    return visitorCheckins;
  }
}
