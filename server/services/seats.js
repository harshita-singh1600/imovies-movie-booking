const mongoose = require('mongoose');
const { Show } = require('../models');

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const UNLOCK = { $set: { 'seats.$[s].status': 'available' }, $unset: { 'seats.$[s].lockedBy': '', 'seats.$[s].lockExpiry': '' } };

// Release specific seats held by one user.
exports.release = (showId, seatNos, userId) =>
  Show.updateOne({ _id: showId }, UNLOCK,
    { arrayFilters: [{ 's.seatNo': { $in: seatNos }, 's.status': 'locked', 's.lockedBy': oid(userId) }] });

// Release every expired hold (runs on a timer). Returns number of shows changed.
exports.releaseExpired = async () => {
  const r = await Show.updateMany({ 'seats.status': 'locked' }, UNLOCK,
    { arrayFilters: [{ 's.status': 'locked', 's.lockExpiry': { $lt: new Date() } }] });
  return r.modifiedCount;
};

exports.buildSeats = (rows, cols) => {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 1; c <= cols; c++) out.push({ seatNo: String.fromCharCode(65 + r) + c, status: 'available' });
  return out;
};
exports.oid = oid;
exports.UNLOCK = UNLOCK;
