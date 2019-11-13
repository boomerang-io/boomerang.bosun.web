/* eslint-disable no-template-curly-in-string */
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Controlled as CodeMirrorReact } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/shell/shell";
import "codemirror/mode/yaml/yaml";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/javascript-hint";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/fold/foldcode.js";
import "codemirror/addon/fold/foldgutter.js";
import "codemirror/addon/fold/brace-fold.js";
import "codemirror/addon/fold/indent-fold.js";
import "codemirror/addon/fold/comment-fold.js";
import "codemirror/addon/comment/comment.js";
import "codemirror-rego/mode";
import { Undo20, Redo20, Copy20, Cut20, Paste20, ArrowUp16, ArrowDown16 } from "@carbon/icons-react";
import { Toolbar, ToolbarItem, Search, Dropdown, Button } from "carbon-components-react";
import "./styles.scss";

const TextEditorView = props => {
  const { value } = props;
  const languages = [
    { id: "rego", text: "Rego", params: { mode: "rego" } },
    { id: "text", text: "Text", params: { mode: "text/plain" } }
  ];

  const editor = useRef(null);
  const [doc, setDoc] = useState();
  const [searchText, setSearchText] = useState("");
  const [clipboard, setClipboard] = useState("");
  const [languageParams, setLanguageParams] = useState(languages[0].params);

  const undo = () => {
    doc.undo();
  };

  const redo = () => {
    doc.redo();
  };

  const cut = () => {
    setClipboard(doc.getSelection());
    doc.replaceSelection("");
  };

  const copy = () => {
    setClipboard(doc.getSelection());
  };

  const paste = () => {
    doc.replaceSelection(clipboard);
  };

  const handleKeyPress = e => {
    if (e.key === "Enter") {
      findNext();
    }
  };

  const handleSearchText = e => {
    const { value } = e.target;
    setSearchText(value);
  };

  const findNext = () => {
    const cursor = doc.getSearchCursor(searchText, doc.getCursor());
    if (cursor.findNext()) {
      doc.setCursor(cursor.to());
      doc.setSelection(cursor.from(), cursor.to());
    }
    editor.current.focus();
  };

  const findPrevious = () => {
    const cursor = doc.getSearchCursor(searchText, doc.getCursor("start"));
    if (cursor.findPrevious()) {
      doc.setCursor(cursor.to());
      doc.setSelection(cursor.from(), cursor.to());
    }
    editor.current.focus();
  };

  const languageOptions = languages.map(language => ({ id: language.id, text: language.text }));

  const onChangeLanguage = language => {
    setLanguageParams(languages.find(value => value.id === language.selectedItem.id).params);
  };

  const foldCode = cm => {
    cm.foldCode(cm.getCursor());
  };

  const toggleComment = cm => {
    cm.toggleComment();
  };

  const blockComment = cm => {
    if (doc.somethingSelected()) {
      const selPosition = doc.listSelections();
      if (!cm.uncomment(selPosition[0].head, selPosition[0].anchor, { fullLines: false })) {
        cm.blockComment(selPosition[0].head, selPosition[0].anchor, { fullLines: false });
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: "80rem",
        maxHeight: "50rem",
        height: "100%",
        width: "100%",
        margin: "auto",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start"
      }}
    >
      <Toolbar className="b-task-text-area">
        <ToolbarItem>
          <Button
            size="small"
            kind="ghost"
            iconDescription="Undo"
            tooltipPosition="bottom"
            tooltipAlignment="end"
            hasIconOnly
            renderIcon={Undo20}
            onClick={undo}
            className="b-task-text-area__button"
          />
        </ToolbarItem>
        <ToolbarItem>
          <Button
            size="small"
            kind="ghost"
            iconDescription="Redo"
            tooltipPosition="bottom"
            tooltipAlignment="center"
            hasIconOnly
            renderIcon={Redo20}
            onClick={redo}
            className="b-task-text-area__button"
          />
        </ToolbarItem>
        <ToolbarItem>
          <Button
            size="small"
            kind="ghost"
            iconDescription="Copy"
            tooltipPosition="bottom"
            tooltipAlignment="center"
            hasIconOnly
            renderIcon={Copy20}
            onClick={copy}
            className="b-task-text-area__button"
          />
        </ToolbarItem>
        <ToolbarItem>
          <Button
            size="small"
            kind="ghost"
            iconDescription="Cut"
            tooltipPosition="bottom"
            tooltipAlignment="center"
            hasIconOnly
            renderIcon={Cut20}
            onClick={cut}
            className="b-task-text-area__button"
          />
        </ToolbarItem>
        <ToolbarItem>
          <Button
            size="small"
            kind="ghost"
            iconDescription="Paste"
            tooltipPosition="bottom"
            tooltipAlignment="center"
            hasIconOnly
            renderIcon={Paste20}
            onClick={paste}
            className="b-task-text-area__button"
          />
        </ToolbarItem>
        <ToolbarItem>
          <Search
            id="search"
            light={false}
            labelText="Search"
            closeButtonLabelText=""
            placeHolderText="Search"
            onChange={handleSearchText}
            onKeyPress={handleKeyPress}
            small
          />
        </ToolbarItem>
        <ToolbarItem>
          <Button
            size="small"
            kind="ghost"
            iconDescription="Find previous"
            tooltipPosition="bottom"
            tooltipAlignment="center"
            hasIconOnly
            renderIcon={ArrowUp16}
            onClick={findPrevious}
            className="b-task-text-area__button"
          />
        </ToolbarItem>
        <ToolbarItem>
          <Button
            size="small"
            kind="ghost"
            iconDescription="Find next"
            tooltipPosition="bottom"
            tooltipAlignment="center"
            hasIconOnly
            renderIcon={ArrowDown16}
            onClick={findNext}
            className="b-task-text-area__button"
          />
        </ToolbarItem>

        <ToolbarItem>
          <div className="b-task-text-area__language-dropdown">
            <Dropdown
              id="dropdown-language"
              type="default"
              label="Language selection"
              ariaLabel="Dropdown"
              light={false}
              initialSelectedItem={
                props.language
                  ? languageOptions.find(languageOption => languageOption.id === props.language)
                  : languageOptions[0]
              }
              items={languageOptions}
              itemToString={item => (item ? item.text : "")}
              onChange={onChangeLanguage}
            />
          </div>
        </ToolbarItem>
      </Toolbar>

      <CodeMirrorReact
        editorDidMount={cmeditor => {
          editor.current = cmeditor;
          setDoc(cmeditor.getDoc());
        }}
        value={value}
        options={{
          theme: "material",
          extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Ctrl-Q": foldCode,
            "Cmd-/": toggleComment,
            "Shift-Alt-A": blockComment,
            "Shift-Opt-A": blockComment
          },
          lineWrapping: true,
          foldGutter: true,
          lineNumbers: true,
          gutters: ["CodeMirrorReact-linenumbers", "CodeMirror-foldgutter"],
          ...languageParams
        }}
        onBeforeChange={(editor, data, value) => {
          props.onChange(value);
        }}
      />
    </div>
  );
};

TextEditorView.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.func.isRequired
};

export default TextEditorView;
