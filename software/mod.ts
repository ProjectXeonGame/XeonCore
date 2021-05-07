import { TTYApplication } from "../tty.ts";

const software: { [key: string]: TTYApplication } = {};

software.echo = async (ctx, argv): Promise<number> => {
  ctx.tty.stdout(argv.join(" "));
  return 0;
};

export default software;
