import { FIELD_KEYS } from "../../shared/housing.mjs";
import type {
  ActiveRequest,
  Analysis,
  ApiErrorBody,
  AppState,
  FieldName,
  HousingInstance,
} from "./types";
type Action =
  | { type: "edit"; field: FieldName; value: string }
  | { type: "load"; profile: HousingInstance }
  | { type: "clear" }
  | { type: "errors"; errors: AppState["fieldErrors"] }
  | { type: "start"; request: ActiveRequest }
  | { type: "success"; token: number; analysis: Analysis }
  | { type: "failure"; token: number; error: ApiErrorBody }
  | { type: "cancel" }
  | { type: "select"; id: string }
  | { type: "clearHistory" };
const blank = () =>
  Object.fromEntries(FIELD_KEYS.map((key) => [key, ""])) as Record<
    FieldName,
    string
  >;
export const initialState = (): AppState => ({
  fields: blank(),
  revision: 0,
  fieldErrors: {},
  active: null,
  result: null,
  error: null,
  history: [],
  selectedIds: [],
  referenceChanged: false,
});
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "edit":
      return {
        ...state,
        fields: { ...state.fields, [action.field]: action.value },
        revision: state.revision + 1,
        fieldErrors: { ...state.fieldErrors, [action.field]: undefined },
      };
    case "load":
      return {
        ...state,
        fields: Object.fromEntries(
          FIELD_KEYS.map((key) => [
            key,
            String(action.profile[key]).replace(".", ","),
          ]),
        ) as Record<FieldName, string>,
        revision: state.revision + 1,
        fieldErrors: {},
        error: null,
      };
    case "clear":
      return {
        ...state,
        fields: blank(),
        revision: state.revision + 1,
        fieldErrors: {},
        error: null,
        active: null,
      };
    case "errors":
      return { ...state, fieldErrors: action.errors, error: null };
    case "start":
      return { ...state, active: action.request, error: null, fieldErrors: {} };
    case "success": {
      if (state.active?.token !== action.token) return state;
      const history = [
          action.analysis,
          ...state.history.filter((item) => item.id !== action.analysis.id),
        ].slice(0, 10),
        ids = new Set(history.map((item) => item.id)),
        selectedIds = state.selectedIds.filter((id) => ids.has(id));
      return {
        ...state,
        active: null,
        result: action.analysis,
        history,
        selectedIds,
        referenceChanged:
          !!state.selectedIds.length && state.selectedIds[0] !== selectedIds[0],
        error: null,
      };
    }
    case "failure":
      if (state.active?.token !== action.token) return state;
      return {
        ...state,
        active: null,
        error: action.error,
        fieldErrors: Object.fromEntries(
          (action.error.issues || [])
            .filter((item) => item.field)
            .map((item) => [item.field, item.message]),
        ),
      };
    case "cancel":
      return { ...state, active: null };
    case "select": {
      const selectedIds = state.selectedIds.includes(action.id)
        ? state.selectedIds.filter((id) => id !== action.id)
        : state.selectedIds.length < 5 &&
            state.history.some((item) => item.id === action.id)
          ? [...state.selectedIds, action.id]
          : state.selectedIds;
      return {
        ...state,
        selectedIds,
        referenceChanged:
          !!state.selectedIds.length && state.selectedIds[0] !== selectedIds[0],
      };
    }
    case "clearHistory":
      return {
        ...state,
        history: [],
        selectedIds: [],
        referenceChanged: false,
      };
  }
}
