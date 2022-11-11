import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  DateTime,
  Badge,
  Flex,
  Grid,
  Heading,
  Select,
  Subheading,
} from "@contentful/f36-components";
import { HomeExtensionSDK } from "@contentful/app-sdk";
import { SDKProvider, useCMA, useSDK } from "@contentful/react-apps-toolkit";
import { Workbench } from "@contentful/f36-workbench";
import { EntryProps } from "contentful-management";

const ContentTypeMap: {
  [key: string]: any;
} = {
  tilPost: "TIL",
  note: "Note",
  "2wKn6yEnZewu2SCCkus4as": "Blog",
  snippet: "Snippet",
};

function isValidEntry(entry: EntryProps) {
  return entry.fields && entry.fields.title;
}

const Home = () => {
  const sdk = useSDK<HomeExtensionSDK>();

  const cma = useCMA();
  const [entries, setEntries] = useState<
    { drafts: EntryProps[]; abandoned: EntryProps[] } | undefined
  >();
  const [order, setOrder] = useState("-sys.updatedAt");
  // state to trigger a refetch of the data
  const [deletionCounter, setDeletionCounter] = useState(0);

  useEffect(() => {
    cma.entry
      .getMany({
        query: {
          "sys.archivedAt[exists]": false,
          "sys.publishedAt[exists]": false,
          order,
        },
      })
      .then((entries) => {
        setEntries(
          entries.items.reduce(
            (acc, cur) => {
              if (isValidEntry(cur)) {
                acc.drafts.push(cur);
              } else {
                acc.abandoned.push(cur);
              }
              return acc;
            },
            { drafts: [] as EntryProps[], abandoned: [] as EntryProps[] }
          )
        );
      });
  }, [cma, order, deletionCounter]);

  return (
    <SDKProvider>
      <Workbench>
        <Workbench.Header title="Better Home Dashboard"></Workbench.Header>
        <Workbench.Sidebar position="left">Drafts</Workbench.Sidebar>
        <Workbench.Content>
          {entries ? (
            <>
              <Flex
                alignItems="center"
                justifyContent="space-between"
                marginBottom="spacingM"
              >
                <Heading style={{ marginBottom: "0" }}>
                  Drafts ({entries.drafts.length}){" "}
                </Heading>
                <Select
                  id="optionSelect-controlled"
                  name="optionSelect-controlled"
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                >
                  <Select.Option value="-sys.updatedAt">
                    Newest first
                  </Select.Option>
                  <Select.Option value="sys.updatedAt">
                    Oldest first
                  </Select.Option>
                </Select>
              </Flex>
              <Grid
                style={{ width: "100%" }}
                columns="1fr 1fr 1fr"
                rowGap="spacingM"
                columnGap="spacingM"
              >
                {entries.drafts.map((entry) => (
                  <Grid.Item key={entry.sys.id}>
                    <Card style={{ height: "100%" }}>
                      <Flex flexDirection="column" style={{ height: "100%" }}>
                        <Flex
                          alignItems="center"
                          justifyContent="space-between"
                          style={{ marginBottom: "0.5em" }}
                        >
                          <DateTime format="day" date={entry.sys.updatedAt} />
                          <Badge variant="primary">
                            {ContentTypeMap[entry.sys.contentType.sys.id]}
                          </Badge>
                        </Flex>
                        <Subheading>{entry.fields.title["en-US"]}</Subheading>
                        <Flex
                          justifyContent="space-between"
                          style={{ marginTop: "auto" }}
                        >
                          <Button
                            size="small"
                            onClick={() =>
                              sdk.navigator.openEntry(entry.sys.id, {
                                slideIn: true,
                              })
                            }
                            style={{ marginTop: "auto" }}
                          >
                            Check it
                          </Button>
                          <Button
                            variant="transparent"
                            size="small"
                            onClick={() =>
                              sdk.dialogs
                                .openConfirm({
                                  title: "Are you sure?",
                                  message: `Delete "${entry.fields.title["en-US"]}"?`,
                                  intent: "negative",
                                  confirmLabel: "Yes!",
                                  cancelLabel: "No...",
                                })
                                .then((result) => {
                                  if (result) {
                                    cma.entry
                                      .delete({ entryId: entry.sys.id })
                                      .then(() => {
                                        sdk.notifier.success("Entry deleted");
                                        setDeletionCounter(deletionCounter + 1);
                                      })
                                      .catch((e) => {
                                        console.log(e);
                                        sdk.notifier.error(
                                          "Something went wrong..."
                                        );
                                      });
                                  }
                                })
                            }
                            style={{ marginTop: "auto" }}
                          >
                            Delete it
                          </Button>
                        </Flex>
                      </Flex>
                    </Card>
                  </Grid.Item>
                ))}
              </Grid>
              <Heading>Abandoned</Heading>
              {entries.abandoned.map((entry) => (
                <span>{entry.sys.id}</span>
              ))}
            </>
          ) : (
            "loading"
          )}
        </Workbench.Content>
      </Workbench>
    </SDKProvider>
  );
};

export default Home;
