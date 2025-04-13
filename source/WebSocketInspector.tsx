import { Box } from "ink";
import React from "react";
import Divider from "./util/Divider.js";
import { formatJSON } from "./util/formatJSON.js";
import { wsLogger } from "./util/logger.js";
import { StompParser } from "./util/stompParser.js";
import Text from "./util/Text.js";
import useStdoutDimensions from "./util/useStdoutDimensions.js";
import { useReadable } from "./util/writable.js";

type WebSocketInspectorProps = {};

const ReadyState: Record<string | number, string> = {
  0: "Connecting",
  1: "Open",
  2: "Closing",
  3: "Closed",
};

const parser = new StompParser();

const WebSocketInspector: React.FC<WebSocketInspectorProps> = ({}) => {
  const log = useReadable(wsLogger);
  const [cols] = useStdoutDimensions();

  return (
    <>
      {log.map((item) => (
        <Box
          flexDirection="column"
          key={item.key}
          width={cols}
          marginBottom={1}
        >
          <Divider />
          {item.type === "stomp/frame" ? (
            <Box flexDirection="column" marginTop={1}>
              <Text bold color="magentaBright">
                {item.command}
              </Text>
              <Box flexDirection="column">
                {item.headers.map(([key, value], i) => (
                  <Box key={i} flexWrap="nowrap" marginRight={1}>
                    <Text wrap="end">
                      <Text bold color="blueBright">
                        {key}:{" "}
                      </Text>
                      <Text wrap="wrap">{value?.toString()}</Text>
                    </Text>
                  </Box>
                ))}
              </Box>
              {item.body && (
                <>
                  {item.headers.find(
                    ([key, value]) =>
                      key === "content-type" && value === "application/json"
                  ) ? (
                    <Text>{formatJSON(parser.decodeText(item.body))}</Text>
                  ) : (
                    <Text>{parser.decodeText(item.body)}</Text>
                  )}
                </>
              )}
            </Box>
          ) : item.type === "readyState" ? (
            <>
              <Text>
                {item.state} {ReadyState[item.state]}
              </Text>
            </>
          ) : item.type === "error" ? (
            <Box>
              <Text>
                {item.code}:{item.reason}
              </Text>
            </Box>
          ) : item.type === "ping" ? (
            <>
              <Text>Ping ⏺</Text>
            </>
          ) : null}
        </Box>
      ))}
    </>
  );
};

export default WebSocketInspector;
