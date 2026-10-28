import { it, expect } from "vitest";
import { validateHousing } from "../../shared/housing.mjs";
import { EXAMPLE } from "../../src/features/simulation/example";
it.each([
  ["MedInc", -1],
  ["HouseAge", -1],
  ["AveRooms", 0],
  ["AveBedrms", -1],
  ["Population", -1],
  ["AveOccup", 0],
  ["Latitude", 90.01],
  ["Longitude", -180.01],
])("rejeita limite inválido de %s", (field, value) =>
  expect(validateHousing({ ...EXAMPLE, [field]: value })).toEqual(
    expect.arrayContaining([expect.objectContaining({ field })]),
  ),
);
it("permite decimais e extremos geográficos", () =>
  expect(
    validateHousing({
      ...EXAMPLE,
      Population: 1.5,
      Latitude: -90,
      Longitude: 180,
    }),
  ).toEqual([]));
