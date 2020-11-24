import { Model } from '@vuex-orm/core';
import helpers from '@/components/js/helpers.js';

export default class State extends Model {
  static entity = 'state';

  static fields() {
    return {
      id: this.number(0), // without a fvixed id, update() creates a record
      defaultVue: this.string(''),
      incubationPeriod: this.string(''),
      managerId: this.string(''),
      organization: this.string(''),
      roomId: this.string(''),
      visitorId: this.string(''),
      zipcode: this.string(''),
      namespace: this.string('/'),
      warningDate: this.string(''),
      warningReason: this.string(''),
      warningRoom: this.string(''),
    };
  }
  static async changeNamespace(val) {
    let p = await this.$update({
      data: { id: 0, namespace: val },
    });
    return p;
  }

  static async updateOrg(val) {
    let p = await this.$update({
      data: { id: 0, organization: val },
    });
    return p;
  }

  static async changeRoomId(val) {
    let p = await this.$update({
      data: { id: 0, roomId: val },
    });
    return p;
  }
  static async updateDefaultVue(val) {
    let p = await this.$update({
      data: { id: 0, defaultVue: val },
    });
    return p;
  }

  static async updateManagerId(val) {
    let p = await this.$update({
      data: { id: 0, roomId: val },
    });
    return p;
  }

  static async changeYourId(val) {
    console.log('STATE: visitorId now:', val);
    let p = await this.$update({
      data: { id: 0, visitorId: val },
    });
    return p;
  }

  static async handleAlert(val) {
    console.log('STATE: warning now:', helpers.pringJson(val));
    let p = await this.$update({
      data: {
        id: 0,
        warningDate: val.warningDate,
        warningReason: val.warningReason,
        warningRoom: val.warningRoom,
      },
    });
    return p;
  }
}
