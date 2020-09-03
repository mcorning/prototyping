import { Model } from '@vuex-orm/core';

export default class Name extends Model {
  static entity = 'names';
  static primaryKey = 'yourId';

  static fields() {
    return {
      // id: this.number(0), // without a fvixed id, update() creates a record
      yourId: this.string(''),
    };
  }

  static async update(val) {
    let p = await this.$create({
      data: { yourId: val },
    });
    return p;
  }

  static async delete(val) {
    console.log('Names before', this.all());

    await this.$delete(val);
    console.log('remaining names', this.all());
    return this.all();
  }
}
