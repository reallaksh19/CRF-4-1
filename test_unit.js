import { UnitSystem } from './viewer/calc/units/unit-system.js';

console.log("1 in to mm:", UnitSystem.convert(1, 'in', 'mm', 'length'));
console.log("100 C to F:", UnitSystem.convert(100, 'C', 'F', 'temperature'));
console.log("Format 1000 N to lbf:", UnitSystem.format(1000, 'force', 'Imperial'));
