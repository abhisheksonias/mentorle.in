"use client";

import { useRef } from "react";
import { Bold, Italic, Link, List, ListOrdered, Quote, Code, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function RichTextEditor({ value, onChange, onFocus, placeholder = "Write your post content here..." }) {
  const textareaRef = useRef(null);

  const insertText = (before, after = "", placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    let newText;
    if (selectedText) {
      newText = beforeText + before + selectedText + after + afterText;
    } else {
      newText = beforeText + before + placeholder + after + afterText;
    }

    onChange(newText);

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + (selectedText || placeholder).length + after.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const linkText = selectedText || "link text";
    const linkUrl = prompt("Enter URL:", "https://");
    
    if (linkUrl) {
      const newText = beforeText + `[${linkText}](${linkUrl})` + afterText;
      onChange(newText);
      
      setTimeout(() => {
        const newCursorPos = start + linkText.length + linkUrl.length + 4;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const insertImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeText = value.substring(0, start);
    const afterText = value.substring(start);

    const imageUrl = prompt("Enter image URL:", "https://");
    const altText = prompt("Enter alt text (optional):", "");
    
    if (imageUrl) {
      const imageMarkdown = altText 
        ? `![${altText}](${imageUrl})`
        : `![](${imageUrl})`;
      const newText = beforeText + imageMarkdown + afterText;
      onChange(newText);
      
      setTimeout(() => {
        const newCursorPos = start + imageMarkdown.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText("**", "**", "bold text")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText("*", "*", "italic text")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertImage}
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText("- ", "", "list item")}
          title="Unordered List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText("1. ", "", "list item")}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText("> ", "", "quote")}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText("`", "`", "code")}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        rows={15}
        className="font-mono text-sm"
      />
      <p className="text-xs text-gray-500">
        Markdown formatting is supported. Use the toolbar above or type markdown syntax directly.
      </p>
    </div>
  );
}

