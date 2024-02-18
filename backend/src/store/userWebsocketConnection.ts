const users = new Map();

export function addUserConnection(userId: string, socket: unknown) {
  users.set(userId, socket);
}

export function getUserConnection(userId: string) {
  return users.get(userId);
}
