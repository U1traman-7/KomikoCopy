/*
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-12-03 20:43:36
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-12-03 20:52:21
 * @FilePath: /ComicEditor/src/Components/ToolsPage/ToolsHeader.tsx
 * @Description:
 */
import {
  Button,
  Popover,
  PopoverContent,
  Image,
  Tooltip,
  PopoverTrigger,
  Card,
} from '@nextui-org/react';
import { BsDiscord } from 'react-icons/bs';
import { useRouter } from 'next/router';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
} from '@nextui-org/react';
import { authAtom } from '../../state';
import { useAtom } from 'jotai';
import { FaArrowLeft } from 'react-icons/fa';

export default function Header({ isMobile }: any) {
  const router = useRouter();

  const [isAuth, setIsAuth] = useAtom(authAtom);
  const loginPath = '/login';

  return (
    <>
      <Navbar
        className='justify-between w-full fixed h-[64px] bg-muted border-b-1 border-border'
        maxWidth={'full'}
        isBlurred={false}>
        <NavbarBrand>
          {/* <Image src="/images/logo_new.webp" className="h-[40px] ml-0 2xl:ml-8" onClick={() => { router.push("/tools"); }} /> */}
          <Button
            variant='light'
            onClick={() => router.push('/')}
            className='min-w-8 flex items-center gap-2'
            startContent={<FaArrowLeft className='h-5 w-5' />}>
            <h2 className='text-2xl font-bold'>Home</h2>
          </Button>
        </NavbarBrand>
        <NavbarContent justify='end'>
          <NavbarContent justify='end'>
            <NavbarItem className='flex items-center'>
              {/* <Button
                            color="primary"
                            variant="flat"
                            className="mr-2 h-10"
                            onClick={() => {
                                window.location.href = 'sms:+16502137491';
                            }}
                        >
                            Text Us
                        </Button> */}

              {!isAuth && (
                <Button
                  color='primary'
                  variant='flat'
                  className='mr-2 h-10'
                  onClick={() => {
                    router.push(loginPath);
                  }}>
                  Login
                </Button>
              )}
              <Button
                as={Link}
                href='https://discord.gg/KJNSBVVkvN'
                variant='flat'
                target='_blank'
                className='mr-0 2xl:mr-12 h-10 bg-[#5865F2] text-primary-foreground'>
                <BsDiscord className='w-5 h-5 mr-2' /> Join Discord
              </Button>
            </NavbarItem>
          </NavbarContent>
        </NavbarContent>
      </Navbar>
    </>
  );
}
