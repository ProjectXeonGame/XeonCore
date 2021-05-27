export interface ArangoUser {
  uuid: string;
  username: string;
  hash: string;
  last_login: number;
  is_online: boolean;
  machine_id: string;
}

export interface ArangoMachine {
  uuid: string;
  filesystem: string;
}
