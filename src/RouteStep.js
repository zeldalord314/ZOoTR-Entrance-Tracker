import React from "react";
import Songs from "./DataObjects/Songs";
import useHover from "./Hooks/useHover";
import Dungeons from "./DataObjects/Dungeons";

export default function RouteStep({ step, isEndStep, routeIsClear, routeHasClearAttribute, routeEndArea, routeEndEntrance, ...props }) {

    const [hoverRef, isHovered] = useHover();

    return <div
        ref={hoverRef}
        className={
            "route-step column has-text-centered" +
            (isEndStep ? " last-route-step " : "") +
            (isEndStep && routeHasClearAttribute && routeIsClear ? " check-cleared "
                : isEndStep && routeHasClearAttribute && !routeIsClear ? " check-not-cleared " : "") +
            ((isEndStep && isHovered) ? " hovered " : "")
        }
        onClick={isEndStep && routeHasClearAttribute ? () => props.toggleEntranceClear(routeEndArea, routeEndEntrance) : null}
    >
        {step.start !== undefined &&
            <span>
                {step.start}
            </span>
        }
        {step.song !== undefined &&
            <span
                className=""
                style={{
                    textShadow:
                        `0px 0px 10px ${Songs[step.song].color},
                        0px 0px 5px ${Songs[step.song].color},
                        1px 2px 9px ${Songs[step.song].color}`
                }}
            >
                {step.song}
            </span>
        }
        {step.area !== undefined &&
            <div className="has-text-weight-semibold">
                {step.area}
            </div>
        }
        {step.entrance !== undefined &&
            <div>
                {step.entrance}
                {![null, undefined].includes(step.area) && " Entrance"}
                {step.area === null && step.entrance === Dungeons["Spirit Temple"] && " Hands"}
            </div>
        }
        {step.end !== undefined &&
            <span>
                {step.end}
            </span>
        }
    </div>
}
