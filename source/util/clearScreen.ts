export default function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}
