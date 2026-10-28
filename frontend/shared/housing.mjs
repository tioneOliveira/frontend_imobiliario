/** @typedef {'MedInc'|'HouseAge'|'AveRooms'|'AveBedrms'|'Population'|'AveOccup'|'Latitude'|'Longitude'} FieldName */
/** @type {{key:FieldName,label:string,help:string,min:number,max?:number,strict?:boolean}[]} */
export const FIELDS = [
  {
    key: "MedInc",
    label: "Renda mediana",
    help: "Escala original do modelo",
    min: 0,
  },
  {
    key: "HouseAge",
    label: "Idade dos imóveis",
    help: "Mediana em anos",
    min: 0,
  },
  {
    key: "AveRooms",
    label: "Cômodos por domicílio",
    help: "Média regional",
    min: 0,
    strict: true,
  },
  {
    key: "AveBedrms",
    label: "Quartos por domicílio",
    help: "Média regional",
    min: 0,
  },
  {
    key: "Population",
    label: "População",
    help: "Total do grupo regional",
    min: 0,
  },
  {
    key: "AveOccup",
    label: "Moradores por domicílio",
    help: "Ocupação média",
    min: 0,
    strict: true,
  },
  {
    key: "Latitude",
    label: "Latitude",
    help: "Graus, entre -90 e 90",
    min: -90,
    max: 90,
  },
  {
    key: "Longitude",
    label: "Longitude",
    help: "Graus, entre -180 e 180",
    min: -180,
    max: 180,
  },
];
export const FIELD_KEYS = FIELDS.map((field) => field.key);
/** @param {any} value @returns {{field:FieldName|null,message:string}[]} */
export function validateHousing(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return [{ field: null, message: "Informe um perfil regional válido." }];
  const issues = [];
  if (
    Object.keys(value).length !== 8 ||
    Object.keys(value).some(
      (key) => !FIELD_KEYS.includes(/** @type {FieldName} */ (key)),
    )
  )
    issues.push({
      field: null,
      message: "Informe exatamente os oito campos do perfil.",
    });
  for (const field of FIELDS) {
    const n = value[field.key];
    if (typeof n !== "number" || !Number.isFinite(n))
      issues.push({ field: field.key, message: "Informe um número válido." });
    else if (
      (field.strict ? n <= field.min : n < field.min) ||
      (field.max !== undefined && n > field.max)
    )
      issues.push({
        field: field.key,
        message:
          field.max !== undefined
            ? "Informe um valor entre " + field.min + " e " + field.max + "."
            : field.strict
              ? "Informe um valor maior que zero."
              : "Informe zero ou um valor positivo.",
      });
  }
  return issues;
}
