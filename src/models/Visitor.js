import { Model } from '@vuex-orm/core';

export default class Visitor extends Model {
  static entity = 'visitors';
  static primaryKey = 'id';

  static fields() {
    return {
      // id: this.number(0), // without a fixed id, update() creates a record
      visitor: this.string(''),
      id: this.string(''),
      nsp: this.string('/'),
    };
  }

  static async update(visitor, id, nsp) {
    let p = await this.$create({
      data: { visitor: visitor, id: id, nsp: nsp },
    });
    return p;
  }

  static async delete(val) {
    console.log('Visitors before', this.all());
    console.log('Deleting Visitor ID', val);
    await this.$delete(val);
    console.log('Remaining Visitors', this.all());
    return this.all();
  }
}
