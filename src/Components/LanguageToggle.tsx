import { Popover, PopoverTrigger, PopoverContent, Button } from "@nextui-org/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IoLanguage } from "react-icons/io5";
import { changeLocale, getLocale, nextTick } from "../utilities";
import i18n from "i18n";

export const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "ja", name: "日本語" },
  { code: "zh-CN", name: "简体中文" },
  { code: "zh-TW", name: "繁體中文" },
  { code: "ko", name: "한국어" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "pt", name: "Português" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "hi", name: "हिंदी" },
  { code: "ru", name: "Русский" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "th", name: "ไทย" },
];

const LanguageToggle = ({ className }: { className?: string }) => {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState("en");

  const changeLanguage = (langCode: string) => {
    setCurrentLanguage(langCode);
    changeLocale(langCode);
    router.push(router.pathname, router.asPath.split('?')[0], { locale: langCode });
  };

  useEffect(() => {
    setTimeout(() => {
      let lang = localStorage.getItem("lang");
      if (!lang) {
        lang = router.locale || "en";
        changeLocale(lang);
      }
      const supportedLngs = Object.keys(i18n.options.resources || {}) as string[];
      if (router.locale && supportedLngs.includes(router.locale)) {
        setCurrentLanguage(router.locale);
      }
    });
  }, [router.locale]);

  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button
          isIconOnly={true}
          variant="light"
          className={`h-8 sm:h-10 lg:min-w-unit-16 lg:px-3 ${className}`}
          aria-label="Language"
        >
          <IoLanguage className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          {/* <span className="ml-2 text-nowrap">
            {languages.find(lang => lang.code === currentLanguage)?.name || "English"}
          </span> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[200px] !justify-start p-0">
        <div className="p-2 max-h-[200px] overflow-y-auto">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="light"
              className="justify-start mb-1 w-full"
              onClick={() => changeLanguage(lang.code)}
            >
              {lang.name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default LanguageToggle;
