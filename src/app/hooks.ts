import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

/**
 * Typed version of useDispatch.
 * Ensures all dispatched actions & thunks are strongly typed.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Typed version of useSelector.
 * Prevents incorrect state access and helps with IntelliSense.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;