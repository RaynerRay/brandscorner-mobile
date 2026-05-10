import {
  approxRoadKmFromStraightLine,
  buildGeocodeQuery,
  DELIVERY_HUBS,
  deliveryHubForCity,
  formatAvgDeliveryTimeRange,
  geocodeNominatim,
  haversineKm,
} from "@/utils/deliveryEstimate";
import { useEffect, useState } from "react";

export type DeliveryEstimate =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ok";
      hubKey: "harare" | "bulawayo";
      hubReference: string;
      straightLineKm: number;
      roadKmApprox: number;
      avgTimeRange: string;
    }
  | {
      status: "skipped";
      reason: "no_hub_city" | "incomplete_address" | "geocode_miss" | "error";
    };

type Addr = {
  street?: string;
  city?: string;
  country?: string;
} | null;

export default function useDeliveryEstimate(address: Addr): DeliveryEstimate {
  const [state, setState] = useState<DeliveryEstimate>({ status: "idle" });

  useEffect(() => {
    if (!address?.city?.trim()) {
      setState({ status: "skipped", reason: "no_hub_city" });
      return;
    }

    const hubKey = deliveryHubForCity(address.city);
    if (!hubKey) {
      setState({ status: "skipped", reason: "no_hub_city" });
      return;
    }

    const street = address.street?.trim() ?? "";
    if (!street) {
      setState({ status: "skipped", reason: "incomplete_address" });
      return;
    }

    const query = buildGeocodeQuery(
      street,
      address.city,
      address.country ?? "Zimbabwe",
    );

    const ac = new AbortController();
    setState({ status: "loading" });

    const t = setTimeout(() => {
      void (async () => {
        try {
          const coords = await geocodeNominatim(query, ac.signal);
          if (ac.signal.aborted) return;
          if (!coords) {
            setState({ status: "skipped", reason: "geocode_miss" });
            return;
          }

          const hub = DELIVERY_HUBS[hubKey];
          const straightLineKm = haversineKm(
            coords.lat,
            coords.lon,
            hub.lat,
            hub.lon,
          );
          const roadKmApprox = approxRoadKmFromStraightLine(straightLineKm);

          setState({
            status: "ok",
            hubKey,
            hubReference: hub.referenceLabel,
            straightLineKm,
            roadKmApprox,
            avgTimeRange: formatAvgDeliveryTimeRange(roadKmApprox),
          });
        } catch {
          if (!ac.signal.aborted) {
            setState({ status: "skipped", reason: "error" });
          }
        }
      })();
    }, 450);

    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [address?.street, address?.city, address?.country]);

  return state;
}
