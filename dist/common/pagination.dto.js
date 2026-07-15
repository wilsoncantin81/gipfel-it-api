"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
function paginate(page = 1, limit = 20) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    return { skip: (p - 1) * l, take: l };
}
//# sourceMappingURL=pagination.dto.js.map