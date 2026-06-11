// _store.js — Ephemeral in-memory session store
// Data lives only as long as the serverless function instance is warm.
// Sessions are explicitly purged when the teacher ends the session.

const sessions = {};

module.exports = { sessions };
