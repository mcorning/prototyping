import { Database } from '@vuex-orm/core';

import State from '@/models/State';
import Message from '@/models/Message';
import Visitor from '@/models/Visitor';

const database = new Database();

database.register(State);
database.register(Message);

database.register(Visitor);

export default database;
