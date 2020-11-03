import { Database } from '@vuex-orm/core';

import State from '@/models/State';
import Message from '@/models/Message';
import Room from '@/models/Room';
import Visitor from '@/models/Visitor';

const database = new Database();

database.register(State);
database.register(Message);
database.register(Room);
database.register(Visitor);

export default database;
