import { useCallback, useReducer } from "react";
import { multiTargetsCalculator } from "@/components/calculator-form/utils/multi-targets-calculator";
import { CalculatorInputs } from "@/components/calculator-form/types";
import { validatePercentage } from "@/components/calculator-form/utils/validate-percentage";
import { useAppDispatch } from "@/redux/hooks";
import { resetInvestmentResults, updateInvestmentResults } from "@/redux/targets-calculator/reducer";

type Profit = {
	amount: number;
	totalExitAmount: number;
	percentage: number;
	currencyCode: string;
	isLoss: boolean;
};

type StopLoss = {
	amount: number;
	totalExitAmount: number;
	percentage: number;
	currencyCode: string;
	isLoss: boolean;
};

type ReducerState = {
	profit: Profit;
	stopLoss: StopLoss;
};

type ReducerAction = { type: "UPDATE"; payload: ReducerState } | { type: "RESET" };

const initialState: ReducerState = {
	profit: {
		amount: 0,
		totalExitAmount: 0,
		percentage: 0,
		currencyCode: "USD",
		isLoss: false,
	},
	stopLoss: {
		amount: 0,
		totalExitAmount: 0,
		percentage: 0,
		currencyCode: "USD",
		isLoss: true,
	},
};

const reducer = (state: ReducerState, action: ReducerAction) => {
	switch (action.type) {
		case "UPDATE":
			return { ...state, ...action.payload };
		case "RESET":
			return initialState;
		default:
			return state;
	}
};

interface UseInvestmentResultsReturn {
	state: ReducerState;
	onResultsUpdate: (data: CalculatorInputs) => void;
	onResultsReset: () => void;
}

export const useInvestmentResults = (): UseInvestmentResultsReturn => {
	const [state, dispatch] = useReducer(reducer, initialState);
	const _dispatch = useAppDispatch();

	const onResultsUpdate = useCallback((data: CalculatorInputs) => {
		const { investedAmount, buyPrice, stopLossPrice, targets } = data;
		const { totalPercentages, isValid } = validatePercentage(targets?.map((t) => t?.sellingPercentage));

		if (!isValid) return alert(`Total selling percentages is ${totalPercentages}%, it should be less than or equal to 100%`);

		const { profit, profitPercentage, totalRevenue, isLoss, stopLoss, stopLossPercentage, totalStopLossRevenue } = multiTargetsCalculator({
			investedAmount,
			buyPrice,
			stopLossPrice,
			targets,
		});

		const payload = {
			profit: {
				amount: profit,
				totalExitAmount: totalRevenue,
				percentage: profitPercentage,
				currencyCode: "USD",
				isLoss: isLoss,
			},
			stopLoss: {
				amount: stopLoss,
				totalExitAmount: totalStopLossRevenue,
				percentage: stopLossPercentage,
				currencyCode: "USD",
				isLoss: true,
			},
		};

		_dispatch(updateInvestmentResults(payload));

		dispatch({
			type: "UPDATE",
			payload,
		});
	}, []);

	const onResultsReset = useCallback(() => {
		_dispatch(resetInvestmentResults());
		dispatch({ type: "RESET" });
	}, []);

	return {
		state,
		onResultsUpdate,
		onResultsReset,
	};
};
