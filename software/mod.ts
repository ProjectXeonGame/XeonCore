import Machine from "../models/machine.ts";
import User from "../models/users.ts";

type SoftwareCaller = (
  machine: Machine,
  caller: User,
  argv: string[],
) => Promise<number>;

const software: { [key: string]: SoftwareCaller } = {};

software.echo = async (machine, user, argv): Promise<number> => {
  return 0;
};
