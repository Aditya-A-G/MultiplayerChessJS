import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Separator from '@/components/ui/separator';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      name: '',
      favoriteColor: 'white',
    },
  });

  // TODO: fix this function
  async function onSubmit(formData: { name: string; favoriteColor: string }) {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      form.reset();
    }, 3000);
  }

  return (
    <main className="w-full h-svh grid grid-rows-[1fr_1px_1fr] md:grid-cols-[1fr_1px_1fr] gap-2">
      <section className=" h-full w-full grid ">
        <div className="h-full w-full  flex flex-col items-center ">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl lg:text-4xl">GAME</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:w-1/2 ">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2"
              >
                <FormField
                  control={form.control}
                  rules={{ required: 'Name is required' }}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="favoriteColor"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Favorite Color</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="white" />
                            </FormControl>
                            <FormLabel className="font-normal">White</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="black" />
                            </FormControl>
                            <FormLabel className="font-normal">Black</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full text-base"
                  disabled={!!isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}{' '}
                  Create Game
                </Button>
              </form>
            </Form>
          </CardContent>
        </div>
      </section>
      <Separator orientation="vertical" className="bg-slate-700" />
      <section className=" h-full">
        <div className="h-full w-full  flex flex-col items-center ">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl lg:text-4xl">HISTORY</CardTitle>
          </CardHeader>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
