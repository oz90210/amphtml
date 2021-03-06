/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {dict, map} from './utils/object';
import {isAmp4Email} from './format';
import {isUrlAttribute} from './url-rewrite';
import {startsWith} from './string';

/** @const {string} */
export const BIND_PREFIX = 'data-amp-bind-';

/** @const {string} */
export const DIFF_KEY = 'i-amphtml-key';

/** @const {string} */
export const DIFF_IGNORE = 'i-amphtml-ignore';

/**
 * Map of AMP element tag name to attributes that, if changed, require
 * replacement of the original element.
 * @const {!Object<string, !Array<string>>}
 */
export const DIFFABLE_AMP_ELEMENTS = {
  'AMP-IMG': ['src', 'srcset', 'layout', 'width', 'height'],
};

/**
 * Most AMP elements don't support ad hoc mutation and should be replaced
 * instead of DOM diff'ed. Some AMP elements can be manually diff'ed.
 *
 * Both of these cases require a special attribute to enable special handling in
 * the diffing algorithm. This function sets the appropriate attribute.
 *
 * @param {!Element} element
 * @param {function(): string} generateKey
 */
export function markElementForDiffing(element, generateKey) {
  const isAmpElement = startsWith(element.tagName, 'AMP-');
  // Don't DOM diff nodes with bindings because amp-bind scans newly rendered
  // elements and discards _all_ old elements _before_ diffing, so preserving
  // old elements would cause loss of functionality.
  const hasBinding = element.hasAttribute('i-amphtml-binding');

  if (!hasBinding && DIFFABLE_AMP_ELEMENTS[element.tagName]) {
    // Nodes marked with "ignore" will not be touched (old element stays).
    // We want this to allow manual diffing afterwards.
    element.setAttribute(DIFF_IGNORE, '');
  } else if (hasBinding || isAmpElement) {
    // Diff'ed node pairs with unique "key" will always be replaced.
    if (!element.hasAttribute(DIFF_KEY)) {
      element.setAttribute(DIFF_KEY, generateKey());
    }
  }
}

/**
 * @const {!Object<string, boolean>}
 * @see https://github.com/ampproject/amphtml/blob/master/spec/amp-html-format.md
 */
export const BLACKLISTED_TAGS = {
  'applet': true,
  'audio': true,
  'base': true,
  'embed': true,
  'frame': true,
  'frameset': true,
  'iframe': true,
  'img': true,
  'link': true,
  'meta': true,
  'object': true,
  'style': true,
  'video': true,
};

/**
 * AMP elements allowed in AMP4EMAIL, modulo:
 * - amp-list, which cannot be nested.
 * - amp-lightbox and amp-image-lightbox, which are deprecated.
 * @const {!Object<string, boolean>}
 * @see https://github.com/ampproject/amphtml/blob/master/spec/email/amp-email-components.md
 */
export const EMAIL_WHITELISTED_AMP_TAGS = {
  'amp-accordion': true,
  'amp-anim': true,
  'amp-bind-macro': true,
  'amp-carousel': true,
  'amp-fit-text': true,
  'amp-img': true,
  'amp-layout': true,
  'amp-selector': true,
  'amp-sidebar': true,
  'amp-state': true,
  'amp-timeago': true,
};

/**
 * Whitelist of tags allowed in triple mustache e.g. {{{name}}}.
 * Very restrictive by design since the triple mustache renders unescaped HTML
 * which, unlike double mustache, won't be processed by the AMP Validator.
 * @const {!Array<string>}
 */
export const TRIPLE_MUSTACHE_WHITELISTED_TAGS = [
  'a',
  'b',
  'br',
  'caption',
  'colgroup',
  'code',
  'del',
  'div',
  'em',
  'hr',
  'i',
  'ins',
  'li',
  'mark',
  'ol',
  'p',
  'q',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'time',
  'td',
  'th',
  'thead',
  'tfoot',
  'tr',
  'u',
  'ul',
];

/**
 * Tag-agnostic attribute whitelisted used by both Caja and DOMPurify.
 * @const {!Array<string>}
 */
export const WHITELISTED_ATTRS = [
  // AMP-only attributes that don't exist in HTML.
  'amp-fx',
  'fallback',
  'heights',
  'layout',
  'min-font-size',
  'max-font-size',
  'on',
  'option',
  'placeholder',
  // Attributes related to amp-form.
  'submitting',
  'submit-success',
  'submit-error',
  'validation-for',
  'verify-error',
  'visible-when-invalid',
  // HTML attributes that are scrubbed by Caja but we handle specially.
  'href',
  'style',
  // Attributes for amp-bind that exist in "[foo]" form.
  'text',
  // Attributes for amp-subscriptions.
  'subscriptions-action',
  'subscriptions-actions',
  'subscriptions-decorate',
  'subscriptions-dialog',
  'subscriptions-display',
  'subscriptions-section',
  'subscriptions-service',
  // Attributes for amp-drilldown.
  'amp-drilldown-submenu',
  'amp-drilldown-submenu-open',
  'amp-drilldown-submenu-close',
  // A global attribute used for structured data.
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemprop
  'itemprop',
];

/**
 * Attributes that are only whitelisted for specific, non-AMP elements.
 * @const {!Object<string, !Array<string>>}
 */
export const WHITELISTED_ATTRS_BY_TAGS = {
  'a': ['rel', 'target'],
  'div': ['template'],
  'form': ['action-xhr', 'verify-xhr', 'custom-validation-reporting', 'target'],
  'input': ['mask-output'],
  'template': ['type'],
  'textarea': ['autoexpand'],
};

/** @const {!Array<string>} */
export const WHITELISTED_TARGETS = ['_top', '_blank'];

/** @const {!Array<string>} */
const BLACKLISTED_ATTR_VALUES = Object.freeze([
  /*eslint no-script-url: 0*/ 'javascript:',
  /*eslint no-script-url: 0*/ 'vbscript:',
  /*eslint no-script-url: 0*/ 'data:',
  /*eslint no-script-url: 0*/ '<script',
  /*eslint no-script-url: 0*/ '</script',
]);

/** @const {!Object<string, !Object<string, !RegExp>>} */
const BLACKLISTED_TAG_SPECIFIC_ATTR_VALUES = Object.freeze(
  dict({
    'input': {
      'type': /(?:image|button)/i,
    },
  })
);

/**
 * Rules in addition to BLACKLISTED_TAG_SPECIFIC_ATTR_VALUES for AMP4EMAIL.
 * @const {!Object<string, !Object<string, !RegExp>>}
 */
const EMAIL_BLACKLISTED_TAG_SPECIFIC_ATTR_VALUES = Object.freeze(
  dict({
    'input': {
      'type': /(?:button|file|image|password)/i,
    },
  })
);

/** @const {!Array<string>} */
const BLACKLISTED_FIELDS_ATTR = Object.freeze([
  'form',
  'formaction',
  'formmethod',
  'formtarget',
  'formnovalidate',
  'formenctype',
]);

/** @const {!Object<string, !Array<string>>} */
const BLACKLISTED_TAG_SPECIFIC_ATTRS = Object.freeze(
  dict({
    'input': BLACKLISTED_FIELDS_ATTR,
    'textarea': BLACKLISTED_FIELDS_ATTR,
    'select': BLACKLISTED_FIELDS_ATTR,
  })
);

/**
 * Rules in addition to BLACKLISTED_TAG_SPECIFIC_ATTRS for AMP4EMAIL.
 * @const {!Object<string, !Array<string>>}
 */
const EMAIL_BLACKLISTED_TAG_SPECIFIC_ATTRS = Object.freeze(
  dict({
    'amp-anim': ['controls'],
    'form': ['name'],
  })
);

/**
 * Test for invalid `style` attribute values.
 *
 * !important avoids overriding AMP styles, while `position:fixed|sticky` is a
 * FixedLayer limitation (it only scans the style[amp-custom] stylesheet
 * for potential fixed/sticky elements). Note that the latter can be
 * circumvented with CSS comments -- not a big deal.
 *
 * @const {!RegExp}
 */
const INVALID_INLINE_STYLE_REGEX = /!important|position\s*:\s*fixed|position\s*:\s*sticky/i;

/**
 * Whether the attribute/value is valid.
 * @param {string} tagName Lowercase tag name.
 * @param {string} attrName Lowercase attribute name.
 * @param {string} attrValue attribute value
 * @param {!Document} doc
 * @param {boolean} opt_purify Is true, skips some attribute sanitizations
 *     that are already covered by DOMPurify.
 * @return {boolean}
 */
export function isValidAttr(
  tagName,
  attrName,
  attrValue,
  doc,
  opt_purify = false
) {
  if (!opt_purify) {
    // "on*" attributes are not allowed.
    if (startsWith(attrName, 'on') && attrName != 'on') {
      return false;
    }

    // No attributes with "javascript" or other blacklisted substrings in them.
    if (attrValue) {
      const normalized = attrValue.toLowerCase().replace(/[\s,\u0000]+/g, '');
      for (let i = 0; i < BLACKLISTED_ATTR_VALUES.length; i++) {
        if (normalized.indexOf(BLACKLISTED_ATTR_VALUES[i]) >= 0) {
          return false;
        }
      }
    }
  }

  // Don't allow certain inline style values.
  if (attrName == 'style') {
    return !INVALID_INLINE_STYLE_REGEX.test(attrValue);
  }

  // Don't allow CSS class names with internal AMP prefix.
  if (attrName == 'class' && attrValue && /(^|\W)i-amphtml-/i.test(attrValue)) {
    return false;
  }

  // Don't allow '__amp_source_origin' in URLs.
  if (isUrlAttribute(attrName) && /__amp_source_origin/.test(attrValue)) {
    return false;
  }

  const isEmail = isAmp4Email(doc);

  // Remove blacklisted attributes from specific tags e.g. input[formaction].
  const attrBlacklist = Object.assign(
    map(),
    BLACKLISTED_TAG_SPECIFIC_ATTRS,
    isEmail ? EMAIL_BLACKLISTED_TAG_SPECIFIC_ATTRS : {}
  )[tagName];
  if (attrBlacklist && attrBlacklist.indexOf(attrName) != -1) {
    return false;
  }

  // Remove blacklisted values for specific attributes for specific tags
  // e.g. input[type=image].
  const attrValueBlacklist = Object.assign(
    map(),
    BLACKLISTED_TAG_SPECIFIC_ATTR_VALUES,
    isEmail ? EMAIL_BLACKLISTED_TAG_SPECIFIC_ATTR_VALUES : {}
  )[tagName];
  if (attrValueBlacklist) {
    const blacklistedValuesRegex = attrValueBlacklist[attrName];
    if (
      blacklistedValuesRegex &&
      attrValue.search(blacklistedValuesRegex) != -1
    ) {
      return false;
    }
  }

  return true;
}
